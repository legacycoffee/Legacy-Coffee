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
      'Necessary local storage is used to keep your account signed in and to remember your cart, checkout-related wholesale details, and latest order information. A preference record stores whether optional embedded content is allowed. These features are required for the website to work as expected and cannot be switched off through this preference panel.',
    ],
  },
  {
    heading: 'Optional embedded content',
    paragraphs: [
      'The Google Maps location map is always displayed. Google may receive technical information from your browser and may use its own storage under its privacy practices. The YouTube-hosted farm story video is optional and remains blocked until you choose to allow it. When enabled, YouTube may receive technical information from your browser and may use its own storage under its privacy practices.',
    ],
  },
  {
    heading: 'Analytics and advertising',
    paragraphs: [
      'The website does not currently use analytics or advertising cookies. If our use changes, this policy and the available preferences will be updated.',
    ],
  },
  {
    heading: 'Change or withdraw your choice',
    paragraphs: [
      'Use the preference controls below to allow or block the optional farm story video at any time. The location map remains visible regardless of this choice. You can also clear browser storage in your browser settings; doing so may sign you out and clear your cart or saved order information.',
    ],
  },
]

export default function CookiePolicy() {
  const { openPreferences } = useCookieConsent()

  return (
    <>
      <LegalPageLayout
        title="Cookie Policy"
        introduction="This policy explains the cookies and browser storage used by Legacy Coffee Uganda and how you can control optional embedded content."
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
