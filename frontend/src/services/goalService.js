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
      data.target_amount?.[0] ||
      data.current_amount?.[0] ||
      data.deadline?.[0] ||
      data.non_field_errors?.[0] ||
      'Não foi possível concluir a solicitação.'

    throw new Error(message)
  }

  return data
}

export function listGoals(filters = {}) {
  const params = new URLSearchParams()

  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status)
  }

  const query = params.toString()
  return request(`/goals/${query ? `?${query}` : ''}`)
}

export function createGoal(goal) {
  return request('/goals/', {
    method: 'POST',
    body: JSON.stringify(goal),
  })
}

export function updateGoal(goalId, goal) {
  return request(`/goals/${goalId}/`, {
    method: 'PATCH',
    body: JSON.stringify(goal),
  })
}
