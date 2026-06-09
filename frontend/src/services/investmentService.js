import { getAuthToken } from './authService.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, options = {}) {
  const token = getAuthToken()
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || data.name?.[0] || data.amount?.[0] || 'Não foi possível concluir a solicitação.')
  }

  return data
}

export function listInvestments() {
  return request('/investments/')
}

export function createInvestment(investment) {
  return request('/investments/', {
    method: 'POST',
    body: JSON.stringify(investment),
  })
}
