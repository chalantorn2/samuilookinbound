const API_BASE = import.meta.env.VITE_API_BASE || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  let data = null
  const text = await res.text()
  if (text) {
    try { data = JSON.parse(text) } catch { data = { message: text } }
  }

  if (!res.ok) {
    const err = new Error((data && data.message) || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  put:  (path, body) => request(path, { method: 'PUT',  body: JSON.stringify(body || {}) }),
  del:  (path) => request(path, { method: 'DELETE' }),
}
