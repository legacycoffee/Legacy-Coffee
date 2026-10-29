import { useCookieConsent } from '../context/useCookieConsent.js'
import LegalPageLayout from '../components/LegalPageLayout.jsx'

const sections = [
  {
    heading: 'What cookies and browser storage do',
    paragraphs: [
      'Cookies are small data files stored by a website in your browser. Legacy Coffee also uses browser local storage, which is a separate browser storage feature, to support core site functions.',
    ],
  },
  {
    heading: 'Necessary storage',
    paragraphs: [
      'Necessary local storage is used to keep your account signed in and to remember your cart, checkout-related wholesale details, and latest order information. A preference record stores your optional feature choices. These necessary features are required for the website to work as expected and cannot be switched off through this preference panel.',
    ],
  },
  {
    heading: 'Optional embedded content',
    paragraphs: [
      'The Google Maps location map is always displayed. Google may receive technical information from your browser and may use its own storage under its privacy practices. The YouTube-hosted farm story video is optional and remains blocked until you choose to allow it. When enabled, YouTube may receive technical information from your browser and may use its own storage under its privacy practices.',
    ],
  },
  {
    heading: 'Optional visitor analytics',
    paragraphs: [
      'If you opt in to anonymous visitor analytics, the website stores a random identifier in your browser and records first and last observed timestamps to count first-time visitors. This metric does not store your name, email address, or page URLs. Browser identifiers observed while signed in are excluded from the unregistered visitor count. You can withdraw this choice at any time in cookie preferences; tracking then stops and the browser identifier is removed.',
    ],
  },
  {
    heading: 'Change or withdraw your choice',
    paragraphs: [
      'Use the preference controls below to allow or block the optional farm story video and anonymous visitor analytics at any time. The location map remains visible regardless of these choices. You can also clear browser storage in your browser settings; doing so may sign you out and clear your cart or saved order information.',
    ],
  },
]

export default function CookiePolicy() {
  const { openPreferences } = useCookieConsent()

  return (
    <>
      <LegalPageLayout
        title="Cookie Policy"
        introduction="This policy explains the cookies and browser storage used by Legacy Coffee Uganda and how you can control optional features."
        sections={sections}
      />
      <div className="bg-[#fffdfa] px-4 pb-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={openPreferences}
            className="min-h-11 bg-[#593a27] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#40291d]"
          >
            Manage cookie preferences
          </button>
        </div>
      </div>
    </>
  )
}
