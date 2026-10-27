import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import { API_BASE_URL } from './api.js'

const AUTH_STORAGE_KEY = 'legacy-coffee-auth'

async function authRequest(path, payload, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: payload ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  })

  const data = response.status === 204 ? null : await response.json()
  if (!response.ok) {
    const message = data?.detail
      || Object.values(data || {}).flat().join(' ')
      || 'Authentication request failed. Please try again.'
    throw new Error(message)
  }
  return data
}

function getSavedAuth() {
  try {
    const value = localStorage.getItem(AUTH_STORAGE_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getSavedAuth)

  const saveAuth = useCallback(data => {
    const nextAuth = { token: data.token, user: data.user }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth))
    setAuth(nextAuth)
  }, [])

  const signIn = useCallback(async credentials => {
    const data = await authRequest('/auth/login/', credentials)
    saveAuth(data)
    return data.user
  }, [saveAuth])

  const signUp = useCallback(async details => {
    const data = await authRequest('/auth/register/', details)
    saveAuth(data)
    return data.user
  }, [saveAuth])

  const updateUser = useCallback(user => {
    if (!auth?.token) return
    saveAuth({ token: auth.token, user })
  }, [auth, saveAuth])

  const clearAuth = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuth(null)
  }, [])

  const signOut = useCallback(async () => {
    try {
      if (auth?.token) {
        await authRequest('/auth/logout/', {}, auth.token)
      }
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      setAuth(null)
    }
  }, [auth])

  const value = useMemo(() => ({
    token: auth?.token || null,
    user: auth?.user || null,
    isAuthenticated: Boolean(auth?.token),
    signIn,
    signUp,
    signOut,
    updateUser,
    clearAuth,
  }), [auth, signIn, signUp, signOut, updateUser, clearAuth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
