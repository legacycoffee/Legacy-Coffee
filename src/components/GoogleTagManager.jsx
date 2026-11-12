import { useEffect, useRef } from 'react'
import { useCookieConsent } from '../context/useCookieConsent.js'

const TAG_MANAGER_ID = 'GTM-NKDHS434'
const DENIED_CONSENT = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
}

export default function GoogleTagManager() {
  const { consent } = useCookieConsent()
  const consentInitialized = useRef(false)

  useEffect(() => {
    window.dataLayer = window.dataLayer || []
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments)
    }

    if (!consentInitialized.current) {
      window.gtag('consent', 'default', DENIED_CONSENT)
      consentInitialized.current = true
    }

    const analyticsGranted = consent?.analytics === true
    window.gtag('consent', 'update', {
      ...DENIED_CONSENT,
      analytics_storage: analyticsGranted ? 'granted' : 'denied',
    })

    if (!analyticsGranted || document.querySelector(`script[data-gtm-container="${TAG_MANAGER_ID}"]`)) {
      return
    }

    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${TAG_MANAGER_ID}`
    script.dataset.gtmContainer = TAG_MANAGER_ID
    script.addEventListener('error', error => {
      script.remove()
      console.error('Unable to load Google Tag Manager.', error)
    }, { once: true })
    document.head.appendChild(script)
  }, [consent?.analytics])

  return null
}
