import { Link, Navigate } from 'react-router-dom'
import {
  LuArrowRight,
  LuMapPin,
  LuPackage,
  LuUserRound,
  LuUserRoundPen,
  LuTrash2,
} from 'react-icons/lu'
import { useAuth } from '../context/useAuth.js'

const accountLinks = [
  { label: 'Profile', description: 'View your personal information', to: '/profile#profile-heading', Icon: LuUserRound },
  { label: 'Change location', description: 'Edit your saved delivery address', to: '/profile#location-heading', Icon: LuMapPin },
  { label: 'Change details', description: 'Update your name or password', to: '/profile#change-details-heading', Icon: LuUserRoundPen },
  { label: 'My orders', description: 'View order history and status', to: '/my-orders', Icon: LuPackage },
  { label: 'Delete account', description: 'Account actions and deletion', to: '/profile#account-actions-heading', Icon: LuTrash2 },
]

export default function MyAccountPage() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/my-account' }} />
  }

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Not provided'
  const address = [user?.delivery_address, user?.delivery_city].filter(Boolean).join(', ') || 'Not provided'

  return (
    <section className="min-h-[55vh] bg-[#fffdfa] px-4 py-9 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl lg:max-w-none">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">Your account</p>
        <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">My account</h1>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <section aria-labelledby="account-overview-heading" className="border border-peach-mid/50 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3 border-b border-peach-mid/40 pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-peach-light text-primary">
                <LuUserRound aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 id="account-overview-heading" className="font-bold text-black">Account information</h2>
                <p className="text-xs text-black/60">Your profile and saved delivery location</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-bold text-black/70">Full name</dt>
                <dd className="mt-1 text-sm font-normal text-black">{name}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-black/70">Email address</dt>
                <dd className="mt-1 break-all text-sm font-normal text-black">{user?.email || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-black/70">Username</dt>
                <dd className="mt-1 break-words text-sm font-normal text-black">{user?.username || 'Not provided'}</dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="text-xs font-bold text-black/70">Delivery location</dt>
                <dd className="mt-1 text-sm font-normal text-black">{address}</dd>
                {user?.delivery_notes && (
                  <dd className="mt-1 whitespace-pre-line text-sm font-normal text-black/70">{user.delivery_notes}</dd>
                )}
                {user?.location_latitude && user?.location_longitude && (
                  <dd className="mt-1 text-xs text-black/55">
                    GPS: {user.location_latitude}, {user.location_longitude}
                  </dd>
                )}
              </div>
            </dl>
          </section>

          <nav aria-label="Account links" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {accountLinks.map(({ label, description, to, Icon }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center justify-between gap-4 border border-peach-mid/50 bg-white p-4 text-black shadow-sm transition-colors hover:border-primary/50 hover:bg-peach-light/30"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="mt-0.5 block text-xs text-black/60">{description}</span>
                  </span>
                </span>
                <LuArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}
