import { useCallback, useMemo, useState } from 'react'
import { CookieConsentContext } from './cookieConsentContext.js'

const COOKIE_CONSENT_KEY = 'legacy-coffee-cookie-consent'

function getSavedConsent() {
  try {
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    if (typeof parsed.embeddedContent !== 'boolean') return null
    return { ...parsed, analytics: parsed.analytics === true }
  } catch {
    return null
  }
}

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(getSavedConsent)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [draftEmbeddedContent, setDraftEmbeddedContent] = useState(consent?.embeddedContent ?? false)
  const [draftAnalytics, setDraftAnalytics] = useState(consent?.analytics ?? false)

  const saveConsent = useCallback((embeddedContent, analytics = false) => {
    const nextConsent = { embeddedContent, analytics, updatedAt: new Date().toISOString() }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(nextConsent))
    setConsent(nextConsent)
    setIsPreferencesOpen(false)
  }, [])

  const openPreferences = useCallback(() => {
    setDraftEmbeddedContent(consent?.embeddedContent ?? false)
    setDraftAnalytics(consent?.analytics ?? false)
    setIsPreferencesOpen(true)
  }, [consent])
  const closePreferences = useCallback(() => setIsPreferencesOpen(false), [])

  const value = useMemo(() => ({
    consent,
    isPreferencesOpen,
    draftEmbeddedContent,
    setDraftEmbeddedContent,
    draftAnalytics,
    setDraftAnalytics,
    saveConsent,
    openPreferences,
    closePreferences,
  }), [consent, isPreferencesOpen, draftEmbeddedContent, draftAnalytics, saveConsent, openPreferences, closePreferences])

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
}
