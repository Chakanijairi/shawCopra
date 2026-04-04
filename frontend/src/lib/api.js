const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const FETCH_TIMEOUT = 30000

function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId))
}

function getErrorMessage(err) {
  if (!err || typeof err === "string") return err || "Request failed"
  if (Array.isArray(err)) return err.map((d) => d.msg || d.message || JSON.stringify(d)).join(", ")
  return err.msg || err.message || String(err)
}

export async function login(email, password) {
  const res = await fetchWithTimeout(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const msg = getErrorMessage(data.detail)
    throw new Error(msg || "Login failed")
  }
  return res.json()
}

export async function signup(full_name, email, password, role = "user") {
  const res = await fetchWithTimeout(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, email, password, role }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const msg = getErrorMessage(data.detail)
    throw new Error(msg || "Signup failed")
  }
  return res.json()
}

export async function getProducts() {
  const res = await fetch(`${API_URL}/products`)
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

export async function createProduct(formData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to create product")
  }
  return res.json()
}

export async function updateProduct(id, formData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to update product")
  }
  return res.json()
}

export async function deleteProduct(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/products/${id}`, { 
    method: "DELETE",
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!res.ok) throw new Error("Failed to delete product")
}

export async function getUserProfile() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/users/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!res.ok) throw new Error("Failed to fetch profile")
  return res.json()
}

export async function updateShippingInfo(shippingData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/users/shipping`, {
    method: "PUT",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(shippingData)
  })
  if (!res.ok) throw new Error("Failed to update shipping info")
  return res.json()
}

export { API_URL }
