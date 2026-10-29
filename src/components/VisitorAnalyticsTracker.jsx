import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { API_BASE_URL } from '../context/api.js'
import { useCookieConsent } from '../context/useCookieConsent.js'

const VISITOR_ID_KEY = 'legacy-coffee-visitor-id'

function createVisitorId() {
  const bytes = new Uint8Array(16)
  window.crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export default function VisitorAnalyticsTracker() {
  const { consent } = useCookieConsent()
  const { isAuthenticated, token } = useAuth()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!consent?.analytics) {
      try {
        localStorage.removeItem(VISITOR_ID_KEY)
      } catch (error) {
        console.error('Unable to clear the visitor analytics identifier.', error)
      }
      return undefined
    }

    let visitorId
    try {
      visitorId = localStorage.getItem(VISITOR_ID_KEY)
      if (!visitorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
        visitorId = createVisitorId()
        localStorage.setItem(VISITOR_ID_KEY, visitorId)
      }
    } catch (error) {
      console.error('Unable to store the visitor analytics identifier.', error)
      return undefined
    }

    const controller = new AbortController()
    fetch(`${API_BASE_URL}/dashboard/visitor/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify({ visitor_id: visitorId }),
      signal: controller.signal,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Visitor tracking request failed with HTTP ${response.status}.`)
      }
    }).catch(error => {
      if (error.name !== 'AbortError') {
        console.error('Unable to record the consented visitor analytics event.', error)
      }
    })

    return () => controller.abort()
  }, [consent?.analytics, isAuthenticated, pathname, token])

  return null
}
