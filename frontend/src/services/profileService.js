import { getAuthToken } from './authService.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(options = {}) {
  const token = getAuthToken()
  const response = await fetch(`${API_URL}/profile/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    ...options,
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || 'Não foi possível carregar o perfil.')
  }

  return data
}

export function getProfile() {
  return request()
}

export function updateProfile(profile) {
  return request({
    method: 'PATCH',
    body: JSON.stringify(profile),
  })
}

export function updatePassword(passwords) {
  return request({
    method: 'PUT',
    body: JSON.stringify(passwords),
  })
}

export function deleteProfile(password) {
  return request({
    method: 'DELETE',
    body: JSON.stringify({ password }),
  })
}
