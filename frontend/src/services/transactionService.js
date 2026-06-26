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
    const message =
      data.detail ||
      data.title?.[0] ||
      data.amount?.[0] ||
      data.target_goal?.[0] ||
      data.target_investment?.[0] ||
      data.date?.[0] ||
      data.transaction_type?.[0] ||
      data.non_field_errors?.[0] ||
      'Não foi possível concluir a solicitação.'

    throw new Error(message)
  }

  return data
}

export function listTransactions(filters = {}) {
  const params = new URLSearchParams()

  if (filters.type && filters.type !== 'all') {
    params.set('type', filters.type)
  }

  const query = params.toString()
  return request(`/transactions/${query ? `?${query}` : ''}`)
}

export function createTransaction(transaction) {
  return request('/transactions/', {
    method: 'POST',
    body: JSON.stringify(transaction),
  })
}
