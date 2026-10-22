export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  let data = null
  if (response.status !== 204) {
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      await response.text()
      throw new Error(
        `The API returned a non-JSON response (HTTP ${response.status}). Restart the Django server and try again.`,
      )
    }
    data = await response.json()
  }
  if (!response.ok) {
    const message = data?.detail
      || Object.values(data || {}).flat().join(' ')
      || 'The request failed. Please try again.'
    throw new Error(message)
  }
  return data
}
