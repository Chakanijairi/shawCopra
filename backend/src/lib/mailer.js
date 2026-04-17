const nodemailer = require('nodemailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeGmailUser(raw) {
  if (raw == null || raw === '') return '';
  return String(raw).replace(/^\uFEFF/, '').trim();
}

function normalizeAppPassword(raw) {
  if (raw == null) return '';
  return String(raw).replace(/^\uFEFF/, '').replace(/\s/g, '').trim();
}

/** True when env has both Gmail user and a non-empty app password (16 chars after removing spaces). */
function isGmailConfigured() {
  const user = normalizeGmailUser(process.env.GMAIL_USER);
  const pass = normalizeAppPassword(process.env.GMAIL_APP_PASSWORD);
  return !!(user && EMAIL_RE.test(user) && pass.length >= 16);
}

/**
 * Sends mail via Gmail SMTP.
 * Requires GMAIL_USER (full Gmail address) and GMAIL_APP_PASSWORD (16-char App Password from Google Account).
 * @throws {Error} code MAIL_NOT_CONFIGURED | SMTP_ERROR | INVALID_RECIPIENT
 */
async function sendMail({ to, subject, text, html }) {
  const user = normalizeGmailUser(process.env.GMAIL_USER);
  const pass = normalizeAppPassword(process.env.GMAIL_APP_PASSWORD);

  const toAddr = normalizeGmailUser(to);
  if (!toAddr || !EMAIL_RE.test(toAddr)) {
    const err = new Error(
      'Invalid recipient email. Ensure the customer order includes a valid email address.'
    );
    err.code = 'INVALID_RECIPIENT';
    throw err;
  }

  if (!user || !pass) {
    const err = new Error(
      'Gmail is not configured. In backend/.env set GMAIL_USER=your@gmail.com and GMAIL_APP_PASSWORD=your_16_char_app_password (Google Account → Security → 2-Step Verification → App passwords), then restart the server.'
    );
    err.code = 'MAIL_NOT_CONFIGURED';
    throw err;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"Shaw's Copra" <${user}>`,
      to: toAddr,
      replyTo: user,
      subject,
      text: text || '',
      html: html || text || '',
    });
  } catch (e) {
    console.error('[mail] SMTP send failed:', e.message);
    const err = new Error(smtpErrorMessage(e));
    err.code = 'SMTP_ERROR';
    throw err;
  }
}

function smtpErrorMessage(e) {
  const m = (e && e.message) || String(e);
  if (/Invalid login|authentication failed|535|534/i.test(m)) {
    return 'Gmail rejected the login. Use an App Password (not your normal Gmail password), and ensure GMAIL_USER matches that Google account. See backend/.env.example.';
  }
  if (/connection|timeout|ECONNREFUSED/i.test(m)) {
    return 'Could not reach Gmail SMTP. Check your network and firewall (port 465).';
  }
  return `Email send failed: ${m}`;
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Admin → customer order update emails (templated). */
const ORDER_UPDATE_TEMPLATES = {
  delivery_in_10_min: {
    label: 'Delivering in ~10 minutes',
    subject: (orderRef) => `${orderRef} — arriving in about 10 minutes`,
    body: (name, orderRef) => ({
      text: `Hi ${name},\n\nGood news — we're on our way! Expect your Shaw's Copra order in about 10 minutes.\n\n${orderRef}\n\nThank you for choosing us.\n— Shaw's Copra`,
      html: `<p>Hi ${escapeHtml(name)},</p><p><strong>We're on our way!</strong> Expect your order in about <strong>10 minutes</strong>.</p><p>${escapeHtml(orderRef)}</p><p>Thank you for choosing Shaw's Copra.</p>`,
    }),
  },
  order_confirmed_preparing: {
    label: 'Order confirmed — preparing',
    subject: (orderRef) => `${orderRef} confirmed — we're preparing it`,
    body: (name, orderRef) => ({
      text: `Hi ${name},\n\nYour order has been confirmed and our team is preparing it now. We'll notify you when it's on the way.\n\n${orderRef}\n\n— Shaw's Copra`,
      html: `<p>Hi ${escapeHtml(name)},</p><p>Your order is <strong>confirmed</strong> and we're <strong>preparing</strong> it now. We'll email you again when it's on the way.</p><p>${escapeHtml(orderRef)}</p><p>— Shaw's Copra</p>`,
    }),
  },
  out_for_delivery: {
    label: 'Out for delivery',
    subject: (orderRef) => `${orderRef} — out for delivery`,
    body: (name, orderRef) => ({
      text: `Hi ${name},\n\nYour order is out for delivery. Please keep your phone available for the rider.\n\n${orderRef}\n\n— Shaw's Copra`,
      html: `<p>Hi ${escapeHtml(name)},</p><p>Your order is <strong>out for delivery</strong>. Please keep your phone available for our rider.</p><p>${escapeHtml(orderRef)}</p><p>— Shaw's Copra</p>`,
    }),
  },
  delivered_complete: {
    label: 'Delivered — thank you',
    subject: (orderRef) => `${orderRef} delivered — thank you!`,
    body: (name, orderRef) => ({
      text: `Hi ${name},\n\nYour order has been marked as delivered. We hope you enjoy your Shaw's Copra products!\n\n${orderRef}\n\n— Shaw's Copra`,
      html: `<p>Hi ${escapeHtml(name)},</p><p>Your order has been <strong>delivered</strong>. We hope you enjoy your products!</p><p>${escapeHtml(orderRef)}</p><p>— Shaw's Copra</p>`,
    }),
  },
  order_delayed: {
    label: 'Order delayed (apology)',
    subject: (orderRef) => `Update: ${orderRef} — short delay`,
    body: (name, orderRef) => ({
      text: `Hi ${name},\n\nWe're sorry — your order is running a little behind. We're working to get it to you as soon as possible and will update you again shortly.\n\n${orderRef}\n\n— Shaw's Copra`,
      html: `<p>Hi ${escapeHtml(name)},</p><p>We're sorry — your order is running <strong>a little behind</strong>. We're working to fulfill it as soon as possible.</p><p>${escapeHtml(orderRef)}</p><p>— Shaw's Copra</p>`,
    }),
  },
  payment_received: {
    label: 'Payment received',
    subject: (orderRef) => `Payment received — ${orderRef}`,
    body: (name, orderRef) => ({
      text: `Hi ${name},\n\nWe've received your payment. Thank you! We'll continue processing your order.\n\n${orderRef}\n\n— Shaw's Copra`,
      html: `<p>Hi ${escapeHtml(name)},</p><p>We've <strong>received your payment</strong>. Thank you! We'll continue processing your order.</p><p>${escapeHtml(orderRef)}</p><p>— Shaw's Copra</p>`,
    }),
  },
};

function getOrderUpdateTemplateList() {
  return Object.entries(ORDER_UPDATE_TEMPLATES).map(([id, v]) => ({
    id,
    label: v.label,
  }));
}

/**
 * Admin → customer order updates: always sent via the shop Gmail in .env (GMAIL_USER + GMAIL_APP_PASSWORD).
 * (We do not send through the customer’s Gmail, so Google sign-in customers and invalid stored app passwords do not break delivery.)
 */
async function sendOrderUpdateEmail(to, customerName, orderId, templateId) {
  const def = ORDER_UPDATE_TEMPLATES[templateId];
  if (!def) {
    return { ok: false, error: 'unknown_template' };
  }
  const name = (customerName && String(customerName).trim()) || 'Customer';
  const orderRef = orderId ? `Order #${orderId}` : 'Your order';
  const subj = def.subject(orderRef);
  const { text, html } = def.body(name, orderRef);
  const payload = { to, subject: subj, text, html };

  await sendMail(payload);
  return { ok: true, emailSent: true };
}

function getAdminNotifyEmail() {
  return (
    process.env.ADMIN_ORDER_NOTIFY_EMAIL?.trim() ||
    process.env.ADMIN_GOOGLE_EMAIL?.trim() ||
    'chawkanijairi8@gmail.com'
  );
}

/**
 * Alert the shop admin when a customer places an order (via shop Gmail SMTP).
 */
async function sendAdminNewOrderAlert({
  orderId,
  total,
  customerName,
  customerEmail,
  paymentMethod,
  totalOrdersInStore,
  itemLines,
}) {
  const to = getAdminNotifyEmail();
  const linesText =
    Array.isArray(itemLines) && itemLines.length ? itemLines.join('\n') : '(no line items)';
  const subj = `New order #${orderId} — Shaw's Copra`;
  const text = [
    `There are now ${totalOrdersInStore} order(s) in the app (this browser/device).`,
    '',
    `New order #${orderId}`,
    `Customer: ${customerName}`,
    `Email: ${customerEmail || '—'}`,
    `Payment: ${paymentMethod}`,
    `Total: ₱${Number(total).toFixed(2)}`,
    '',
    'Items:',
    linesText,
  ].join('\n');
  const html = `<p><strong>New order #${escapeHtml(String(orderId))}</strong></p>
<p>Total orders in app: <strong>${escapeHtml(String(totalOrdersInStore))}</strong></p>
<ul>
<li>Customer: ${escapeHtml(customerName)}</li>
<li>Email: ${escapeHtml(customerEmail || '—')}</li>
<li>Payment: ${escapeHtml(paymentMethod)}</li>
<li>Total: ₱${escapeHtml(Number(total).toFixed(2))}</li>
</ul>
<p><strong>Items</strong></p>
<pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(linesText)}</pre>`;
  await sendMail({ to, subject: subj, text, html });
}

/**
 * Email a table of orders (from the admin device) with counts; list is capped for size.
 */
async function sendAdminOrdersDigestEmail({ orders, pendingCount }) {
  const to = getAdminNotifyEmail();
  const list = Array.isArray(orders) ? orders : [];
  const n = list.length;
  const subj = `Orders summary: ${n} order(s) — Shaw's Copra`;
  let text = `You have ${n} order(s) stored in the app (this device).`;
  if (pendingCount != null) {
    text += ` ${pendingCount} pending.`;
  }
  text += '\n\n';
  const slice = list.slice(0, 50);
  slice.forEach((o) => {
    const name = o?.shippingInfo?.fullName || '?';
    text += `#${o?.id} — ${name} — ₱${Number(o?.total || 0).toFixed(2)} — ${o?.status || '?'}\n`;
  });
  if (list.length > 50) {
    text += `\n... and ${list.length - 50} more (not listed in this email).\n`;
  }
  const rows = slice
    .map(
      (o) =>
        `<tr><td>${escapeHtml(String(o?.id ?? ''))}</td><td>${escapeHtml(
          String(o?.shippingInfo?.fullName || '')
        )}</td><td>₱${Number(o?.total || 0).toFixed(2)}</td><td>${escapeHtml(
          String(o?.status || '')
        )}</td></tr>`
    )
    .join('');
  const pendingHtml =
    pendingCount != null ? ` (${escapeHtml(String(pendingCount))} pending)` : '';
  const html = `<p><strong>${n} order(s)</strong>${pendingHtml}</p>
<p style="color:#666;font-size:12px;">Reflects orders stored in this browser only.</p>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
<tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th></tr>${rows}</table>`;
  await sendMail({ to, subject: subj, text, html });
}

module.exports = {
  sendMail,
  isGmailConfigured,
  getOrderUpdateTemplateList,
  sendOrderUpdateEmail,
  sendAdminNewOrderAlert,
  sendAdminOrdersDigestEmail,
};
