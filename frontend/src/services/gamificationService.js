import { getAuthToken } from './authService.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export async function getGamification() {
  const token = getAuthToken()
  const response = await fetch(`${API_URL}/gamification/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || 'Não foi possível carregar a gamificação.')
  }

  return data
}
