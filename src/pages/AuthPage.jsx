import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LuCoffee, LuLockKeyhole } from 'react-icons/lu'
import { useAuth } from '../context/useAuth.js'
import { getCurrentCoordinates } from '../context/geolocation.js'

const inputClass = 'mt-1.5 w-full border border-peach-mid px-3.5 py-3 text-sm text-black outline-none placeholder:text-black/40 focus:border-primary focus:ring-2 focus:ring-primary/20'

export default function AuthPage({ mode }) {
  const isSignUp = mode === 'signup'
  const { isAuthenticated, user, signIn, signUp } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '',
    delivery_address: '', delivery_city: '', delivery_notes: '',
    location_latitude: '', location_longitude: '',
  })
  const [error, setError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [locationStatus, setLocationStatus] = useState('')
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const destination = location.state?.from || '/checkout'
  const authenticatedDestination = !isSignUp && user?.is_staff ? '/admin' : destination

  if (isAuthenticated) {
    return <Navigate to={authenticatedDestination} replace />
  }

  const handleChange = event => {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  }

  const fetchLocation = async () => {
    setLocationError('')
    setLocationStatus('')
    setIsFetchingLocation(true)
    try {
      const coordinates = await getCurrentCoordinates()
      setForm(current => ({ ...current, ...coordinates }))
      setLocationStatus(`Device coordinates captured: ${coordinates.location_latitude}, ${coordinates.location_longitude}`)
    } catch (requestError) {
      setLocationError(requestError.message)
    } finally {
      setIsFetchingLocation(false)
    }
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (isSignUp) {
        await signUp({
          ...form,
          location_latitude: form.location_latitude || null,
          location_longitude: form.location_longitude || null,
        })
        navigate(destination, { replace: true })
      } else {
        const signedInUser = await signIn({ email: form.email, password: form.password })
        navigate(signedInUser.is_staff ? '/admin' : destination, { replace: true })
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="bg-[#fffdfa] px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden border border-peach-mid/50 bg-white shadow-sm md:grid-cols-2">
        <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden p-10 text-white md:flex">
          <img
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop&q=85"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" />
          <div className="relative flex items-center gap-2 text-white">
            <LuCoffee aria-hidden="true" className="h-7 w-7" />
            <span className="text-lg font-bold">Legacy Coffee</span>
          </div>
          <div className="relative">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-peach">Coffee with a story</p>
            <h1 className="text-3xl font-bold leading-tight text-white">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
              {isSignUp
                ? 'Create an account to send your coffee order request and keep your details ready for next time.'
                : 'Sign in to send your coffee order request and access your saved details.'}
            </p>
          </div>
          <p className="relative text-xs text-white/75">Proudly sourced from Western Uganda.</p>
        </div>

        <div className="p-5 sm:p-8 md:p-10">
          <Link to="/" className="text-sm font-medium text-black/65 transition-colors hover:text-primary">← Back to home</Link>
          <div className="mt-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center bg-peach-light text-black md:hidden">
              <LuLockKeyhole aria-hidden="true" className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Legacy Coffee account</p>
            <h2 className="mt-2 text-2xl font-bold text-black">{isSignUp ? 'Sign up' : 'Sign in'}</h2>
            <p className="mt-1 text-sm text-black/65">
              {isSignUp ? 'Create an account to continue to checkout.' : 'Sign in to continue to checkout.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isSignUp && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-black" htmlFor="signup-first-name">
                    First name
                    <input id="signup-first-name" autoComplete="given-name" name="first_name" value={form.first_name} onChange={handleChange} className={inputClass} />
                  </label>
                  <label className="block text-sm font-medium text-black" htmlFor="signup-last-name">
                    Last name
                    <input id="signup-last-name" autoComplete="family-name" name="last_name" value={form.last_name} onChange={handleChange} className={inputClass} />
                  </label>
                </div>
                <label className="block text-sm font-medium text-black" htmlFor="signup-username">
                  Username
                  <input id="signup-username" required autoComplete="username" name="username" value={form.username} onChange={handleChange} className={inputClass} />
                </label>
                <div className="border-t border-peach-mid/40 pt-4">
                  <p className="font-semibold text-black">Delivery location <span className="font-normal text-black/55">(optional)</span></p>
                  <p className="mt-1 text-xs leading-relaxed text-black/60">
                    Save an address for checkout, or capture device coordinates. Coordinates stay with your account and are not sent to a geocoding service.
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-black" htmlFor="signup-delivery-city">
                      Town or city
                      <input id="signup-delivery-city" autoComplete="address-level2" name="delivery_city" value={form.delivery_city} onChange={handleChange} className={inputClass} />
                    </label>
                    <label className="block text-sm font-medium text-black sm:col-span-2" htmlFor="signup-delivery-address">
                      Street address
                      <input id="signup-delivery-address" autoComplete="street-address" name="delivery_address" value={form.delivery_address} onChange={handleChange} className={inputClass} />
                    </label>
                    <label className="block text-sm font-medium text-black sm:col-span-2" htmlFor="signup-delivery-notes">
                      Delivery notes
                      <textarea id="signup-delivery-notes" name="delivery_notes" rows={2} value={form.delivery_notes} onChange={handleChange} className={`${inputClass} resize-y`} />
                    </label>
                  </div>
                  <button
                    type="button"
                    disabled={isFetchingLocation}
                    onClick={fetchLocation}
                    className="mt-3 border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-peach-light/40 disabled:opacity-60"
                  >
                    {isFetchingLocation ? 'Fetching location…' : 'Fetch device location'}
                  </button>
                  {locationError && <p role="alert" className="mt-2 text-sm text-red-700">{locationError}</p>}
                  {locationStatus && <p role="status" className="mt-2 text-sm text-green-700">{locationStatus}</p>}
                </div>
              </>
            )}
            <label className="block text-sm font-medium text-black" htmlFor="auth-email">
              Email address
              <input id="auth-email" required type="email" autoComplete="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-black" htmlFor="auth-password">
              Password
              <input id="auth-password" required type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} name="password" value={form.password} onChange={handleChange} className={inputClass} />
            </label>

            {error && <p role="alert" className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#F58537] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#e8742b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-black/70">
            {isSignUp ? 'Already have an account?' : 'New to Legacy Coffee?'}{' '}
            <Link
              to={isSignUp ? '/signin' : '/signup'}
              state={{ from: destination }}
              className="font-semibold text-black underline underline-offset-2 hover:text-primary"
            >
              {isSignUp ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
