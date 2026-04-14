const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  getOrderUpdateTemplateList,
  sendOrderUpdateEmail,
  sendAdminNewOrderAlert,
  sendAdminOrdersDigestEmail,
} = require('../lib/mailer');

const ORDER_NOTIFY_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const router = express.Router();

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, username, role,
              shipping_address, shipping_city, shipping_zip, shipping_phone
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ detail: 'Failed to fetch profile' });
  }
});

router.put('/shipping', authMiddleware, async (req, res) => {
  try {
    const { fullName, address, city, zipCode, phone } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, shipping_address = $2, shipping_city = $3, 
           shipping_zip = $4, shipping_phone = $5 
       WHERE id = $6 
       RETURNING id, full_name, email, shipping_address, shipping_city, shipping_zip, shipping_phone`,
      [fullName, address, city, zipCode, phone, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update shipping error:', error);
    res.status(500).json({ detail: 'Failed to update shipping info' });
  }
});

router.get('/order-email-templates', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ templates: getOrderUpdateTemplateList() });
});

router.post('/send-order-email', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, customerName, orderId, templateId } = req.body;

    if (!email || typeof email !== 'string' || !ORDER_NOTIFY_EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ detail: 'A valid customer email is required' });
    }
    if (!templateId || typeof templateId !== 'string') {
      return res.status(400).json({ detail: 'templateId is required' });
    }

    const result = await sendOrderUpdateEmail(
      email.trim(),
      customerName,
      orderId != null ? String(orderId) : '',
      templateId.trim()
    );

    if (!result.ok) {
      return res.status(400).json({ detail: 'Unknown message template' });
    }

    res.json({
      message: 'Email sent to the customer',
      emailSent: true,
    });
  } catch (e) {
    console.error('send-order-email error:', e.message);
    if (e.code === 'MAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        detail: e.message,
        code: 'MAIL_NOT_CONFIGURED',
      });
    }
    if (e.code === 'SMTP_ERROR') {
      return res.status(502).json({
        detail: e.message,
        code: 'SMTP_ERROR',
      });
    }
    res.status(500).json({
      detail: e.message || 'Failed to send email',
    });
  }
});

router.post('/notify-admin/new-order', authMiddleware, async (req, res) => {
  try {
    const { order, totalOrdersInStore } = req.body || {};
    if (!order || order.id == null) {
      return res.status(400).json({ detail: 'order with id is required' });
    }
    const id = order.id;
    const total = Number(order.total) || 0;
    const customerName =
      (order.shippingInfo?.fullName && String(order.shippingInfo.fullName).trim()) || 'Customer';
    const customerEmail =
      (order.shippingInfo?.email && String(order.shippingInfo.email).trim()) || '';
    const paymentMethod =
      order.paymentMethod === 'cod' ? 'Cash on delivery' : 'GCash';
    const itemLines = Array.isArray(order.itemLines)
      ? order.itemLines.map((x) => String(x))
      : [];

    await sendAdminNewOrderAlert({
      orderId: id,
      total,
      customerName,
      customerEmail,
      paymentMethod,
      totalOrdersInStore: Math.max(0, Number(totalOrdersInStore) || 0),
      itemLines,
    });
    res.json({ message: 'Admin notified', ok: true });
  } catch (e) {
    console.error('notify-admin/new-order error:', e.message);
    if (e.code === 'MAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        detail: e.message,
        code: 'MAIL_NOT_CONFIGURED',
      });
    }
    if (e.code === 'SMTP_ERROR') {
      return res.status(502).json({
        detail: e.message,
        code: 'SMTP_ERROR',
      });
    }
    res.status(500).json({
      detail: e.message || 'Failed to notify admin',
    });
  }
});

router.post('/admin/email-orders-summary', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { orders } = req.body || {};
    if (!Array.isArray(orders)) {
      return res.status(400).json({ detail: 'orders array is required' });
    }
    const pendingCount = orders.filter((o) => o && o.status === 'pending').length;
    await sendAdminOrdersDigestEmail({ orders, pendingCount });
    res.json({ message: 'Summary emailed to admin', ok: true });
  } catch (e) {
    console.error('admin/email-orders-summary error:', e.message);
    if (e.code === 'MAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        detail: e.message,
        code: 'MAIL_NOT_CONFIGURED',
      });
    }
    if (e.code === 'SMTP_ERROR') {
      return res.status(502).json({
        detail: e.message,
        code: 'SMTP_ERROR',
      });
    }
    res.status(500).json({
      detail: e.message || 'Failed to send summary email',
    });
  }
});

module.exports = router;
