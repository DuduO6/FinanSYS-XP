import { getAuthToken } from './authService.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export async function getReports() {
  const token = getAuthToken()
  const response = await fetch(`${API_URL}/reports/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || 'Não foi possível carregar os relatórios.')
  }

  return data
}
