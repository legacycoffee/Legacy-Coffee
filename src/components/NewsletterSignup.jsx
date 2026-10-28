import { useState } from 'react'
import { LuArrowRight, LuMail } from 'react-icons/lu'
import { apiRequest } from '../context/api.js'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      const response = await apiRequest('/newsletter/subscribe/', {
        method: 'POST',
        body: { email },
      })
      setMessage(response.message || 'You are subscribed to Legacy Coffee updates.')
      setEmail('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="newsletter-signup-heading" className="bg-[#f4eee8] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto grid max-w-7xl gap-8 overflow-hidden bg-[#2b211b] px-6 py-8 text-white sm:px-9 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:px-12 lg:py-12">
        <div className="max-w-2xl">
          <div className="mb-4 flex h-11 w-11 items-center justify-center bg-[#f58537] text-white">
            <LuMail aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f6a66f]">From our farms to your inbox</p>
          <h2 id="newsletter-signup-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Good coffee news, freshly brewed.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
            Get harvest stories, coffee updates, and news from our farming communities.
          </p>
        </div>

        <div className="w-full lg:max-w-md">
          <form onSubmit={handleSubmit} className="flex flex-row gap-2">
            <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
            <input
              id="footer-newsletter-email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="Your email address"
              className="min-h-11 min-w-0 flex-1 border border-white/20 bg-white px-2.5 py-2.5 text-xs text-stone-900 outline-none placeholder:text-stone-400 focus:border-[#f58537] focus:ring-2 focus:ring-[#f58537]/40 sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 bg-[#f58537] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#d96b25] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60 sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
            >
              {isSubmitting ? 'Subscribing…' : 'Subscribe'}
              {!isSubmitting && <LuArrowRight aria-hidden="true" className="h-4 w-4" />}
            </button>
          </form>
          {error && <p role="alert" className="mt-3 text-sm text-red-200">{error}</p>}
          {message && <p role="status" className="mt-3 text-sm font-medium text-emerald-200">{message}</p>}
          {!error && !message && <p className="mt-3 text-xs text-white/45">Occasional updates only. Unsubscribe anytime.</p>}
        </div>
      </div>
    </section>
  )
}
