const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const AUTH_TOKEN_KEY = 'finansys.auth.token'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      data.detail ||
      data.non_field_errors?.[0] ||
      data.email?.[0] ||
      data.password?.[0] ||
      data.confirmPassword?.[0] ||
      'Não foi possível concluir a solicitação.'

    throw new Error(message)
  }

  return data
}

export async function login(credentials) {
  return request('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function registerAccount(credentials) {
  return request('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function getCurrentUser(token) {
  return request('/auth/me/', {
    headers: {
      Authorization: `Token ${token}`,
    },
  })
}

export function saveAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}
