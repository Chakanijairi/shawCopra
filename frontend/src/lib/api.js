export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000")
  .replace(/\/$/, "")
const FETCH_TIMEOUT = 30000

/** Clears client auth when the server rejects the session (401). */
export function clearStoredAuth() {
  try {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("googleProfile")
  } catch {
    /* ignore */
  }
}

function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  return fetch(url, {
    ...options,
    credentials: options.credentials ?? "include",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId))
}

function getErrorMessage(err) {
  if (!err || typeof err === "string") return err || "Request failed"
  if (Array.isArray(err)) return err.map((d) => d.msg || d.message || JSON.stringify(d)).join(", ")
  return err.msg || err.message || String(err)
}

/** Normalizes API error bodies (Express may use `detail` as string or array). */
function messageFromApiBody(data) {
  if (!data || typeof data !== "object") return "Request failed"
  const d = data.detail
  if (typeof d === "string" && d.trim()) return d
  if (Array.isArray(d)) return getErrorMessage(d)
  if (typeof data.message === "string" && data.message.trim()) return data.message
  if (typeof data.error === "string") return data.error
  return "Request failed"
}

function rethrowNetworkError(err) {
  if (err?.name === "AbortError") {
    throw new Error("Request timed out. Check that the API is running.")
  }
  throw new Error(
    "Cannot reach the API. Start the backend (npm run dev in the backend folder) or set VITE_API_URL if it runs elsewhere."
  )
}

export async function login(emailOrUsername, password) {
  let res
  try {
    res = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailOrUsername, password }),
    })
  } catch (err) {
    rethrowNetworkError(err)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(messageFromApiBody(data) || "Login failed")
  }
  if (!data.access_token) {
    throw new Error(messageFromApiBody(data) || "Login failed")
  }
  return data
}

export async function loginWithGoogle(credential) {
  let res
  try {
    res = await fetchWithTimeout(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    })
  } catch (err) {
    rethrowNetworkError(err)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(messageFromApiBody(data) || "Google sign-in failed")
  }
  if (!data.access_token) {
    throw new Error(messageFromApiBody(data) || "Google sign-in failed")
  }
  return data
}

export async function signup({ full_name, email, phone, address, password }) {
  const body = {
    full_name: String(full_name ?? "").trim(),
    email: String(email ?? "").trim(),
    phone: String(phone ?? "").trim(),
    address: String(address ?? "").trim(),
    password: String(password ?? "").trim(),
  }
  const res = await fetchWithTimeout(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(messageFromApiBody(data) || "Signup failed")
  }
  return data
}

/** @param {{ adminScope?: boolean }} [opts] - `adminScope` requests full list (admin dashboard only; requires admin JWT). */
export async function getProducts(opts = {}) {
  const token = localStorage.getItem("token")
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const q = opts.adminScope ? "?scope=admin" : ""
  const res = await fetch(`${API_URL}/products${q}`, { headers })
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

export async function getProduct(id) {
  const res = await fetch(`${API_URL}/products/${id}`)
  if (!res.ok) throw new Error("Failed to fetch product")
  return res.json()
}

export async function createProduct(formData) {
  const token = localStorage.getItem("token")
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to create product")
  }
  return res.json()
}

export async function updateProduct(id, formData) {
  const token = localStorage.getItem("token")
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to update product")
  }
  return res.json()
}

export async function deleteProduct(id) {
  const token = localStorage.getItem("token")
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to delete product")
}

/**
 * Deducts `stock` in the database for each cart line when an order is placed.
 * @param {Array<{ id: number, quantity: number }>} items
 */
export async function purchaseDeductStock(items) {
  const token = localStorage.getItem("token")
  if (!token) {
    throw new Error("Please sign in to complete your order.")
  }
  let res
  try {
    res = await fetchWithTimeout(`${API_URL}/products/purchase-stock`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    })
  } catch (err) {
    rethrowNetworkError(err)
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) {
    clearStoredAuth()
    throw new Error(messageFromApiBody(data) || "Session expired. Please sign in again.")
  }
  if (!res.ok) {
    throw new Error(messageFromApiBody(data) || "Could not reserve stock for your order.")
  }
  return data
}

export async function getUserProfile() {
  const token = localStorage.getItem("token")
  if (!token) {
    throw new Error("Not authenticated")
  }
  const res = await fetch(`${API_URL}/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    clearStoredAuth()
    throw new Error("Session expired. Please sign in again.")
  }
  if (!res.ok) throw new Error("Failed to fetch profile")
  return res.json()
}

export async function updateShippingInfo(shippingData) {
  const token = localStorage.getItem("token")
  const res = await fetch(`${API_URL}/users/shipping`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shippingData),
  })
  if (!res.ok) throw new Error("Failed to update shipping info")
  return res.json()
}

export async function getOrderNotificationTemplates() {
  const token = localStorage.getItem("token")
  const res = await fetch(`${API_URL}/users/order-email-templates`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to load email templates")
  }
  return res.json()
}

export async function sendOrderCustomerEmail({ email, customerName, orderId, templateId }) {
  const token = localStorage.getItem("token")
  const res = await fetch(`${API_URL}/users/send-order-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, customerName, orderId, templateId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to send email")
  }
  return res.json()
}

/** Fire-and-forget: emails admin when a customer completes checkout (does not block UX). */
export async function notifyAdminNewOrder({ order, totalOrdersInStore }) {
  const token = localStorage.getItem("token")
  if (!token) return
  try {
    const res = await fetchWithTimeout(`${API_URL}/users/notify-admin/new-order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order, totalOrdersInStore }),
    })
    if (res.status === 401) {
      clearStoredAuth()
      return
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.warn("[notify admin new order]", messageFromApiBody(data) || "failed")
    }
  } catch (err) {
    console.warn("[notify admin new order]", err?.message || err)
  }
}

export async function emailAdminOrdersSummary(orders) {
  const token = localStorage.getItem("token")
  if (!token) {
    throw new Error("Not authenticated")
  }
  let res
  try {
    res = await fetchWithTimeout(`${API_URL}/users/admin/email-orders-summary`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orders }),
    })
  } catch (err) {
    rethrowNetworkError(err)
  }
  if (res.status === 401) {
    clearStoredAuth()
    throw new Error("Session expired. Please sign in again.")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(messageFromApiBody(data) || "Failed to send summary email")
  }
  return data
}
