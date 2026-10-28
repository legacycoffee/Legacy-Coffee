import { useCookieConsent } from '../context/useCookieConsent.js'

export default function CookieConsentManager() {
  const {
    consent,
    isPreferencesOpen,
    draftEmbeddedContent,
    setDraftEmbeddedContent,
    saveConsent,
    openPreferences,
    closePreferences,
  } = useCookieConsent()
  const shouldShowNotice = !consent && !isPreferencesOpen

  if (!shouldShowNotice && !isPreferencesOpen) return null

  if (isPreferencesOpen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/60 p-4" role="presentation">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-heading"
          className="w-full max-w-lg border border-stone-200 bg-white p-5 shadow-2xl sm:p-6"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a75a31]">Your privacy</p>
          <h2 id="cookie-preferences-heading" className="mt-2 text-xl font-bold text-stone-900">Cookie and storage preferences</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Necessary browser storage keeps your cart and sign-in working and is always active. The location map is always displayed; this choice controls only the YouTube farm story video.
          </p>
          <div className="mt-5 space-y-3">
            <div className="flex items-start justify-between gap-4 border border-stone-200 p-3">
              <div>
                <p className="text-sm font-semibold text-stone-800">Necessary storage</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">Cart, account session, and this preference. Always active.</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-emerald-700">Required</span>
            </div>
            <label className="flex cursor-pointer items-start justify-between gap-4 border border-stone-200 p-3">
              <span>
                <span className="block text-sm font-semibold text-stone-800">Optional farm story video</span>
                <span className="mt-1 block text-xs leading-5 text-stone-500">Allow the YouTube video on the About page to load.</span>
              </span>
              <input
                type="checkbox"
                checked={draftEmbeddedContent}
                onChange={event => setDraftEmbeddedContent(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#593a27]"
              />
            </label>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={closePreferences} className="min-h-10 border border-stone-300 px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50">
              Cancel
            </button>
            <button type="button" onClick={() => saveConsent(draftEmbeddedContent)} className="min-h-10 bg-[#593a27] px-4 text-sm font-semibold text-white hover:bg-[#40291d]">
              Save preferences
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <aside aria-label="Cookie and storage preferences" className="fixed inset-x-0 bottom-0 z-[90] border-t-4 border-[#c8895b] bg-[#40291d] p-4 text-white shadow-[0_-8px_30px_rgba(28,25,23,0.28)] sm:p-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-3xl">
          <p className="mt-1 text-xs leading-5 text-white/80">
            We use cookies to improve your experience, remember your preferences, and keep our website secure. You can manage your cookie settings whenever you like.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => saveConsent(false)} className="min-h-10 border border-white/50 px-3 text-xs font-semibold text-white hover:bg-white/10">
            Reject All
          </button>
          <button type="button" onClick={openPreferences} className="min-h-10 border border-white/50 px-3 text-xs font-semibold text-white hover:bg-white/10">
            Cookie settings
          </button>
          <button type="button" onClick={() => saveConsent(true)} className="min-h-10 bg-white px-3 text-xs font-semibold text-[#40291d] hover:bg-[#f4e8db]">
            Accept All
          </button>
        </div>
      </div>
    </aside>
  )
}
