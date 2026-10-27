import { useState } from 'react'
import { apiRequest } from '../context/api.js'

const pastIssues = [
  { title: 'Harvest Season 2024 Recap', date: 'December 2024', excerpt: 'A record-breaking harvest season with over 50,000kg of premium coffee collected from our farmer network.' },
  { title: 'Women in Coffee Initiative Launch', date: 'October 2024', excerpt: 'We launched our women empowerment program, enrolling 80 women farmers in our first cohort.' },
  { title: 'New Export Partnership Announced', date: 'August 2024', excerpt: 'Legacy Coffee signs a landmark export deal to bring Ugandan coffee to European markets.' },
]

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
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
    <div>
      {/* Hero */}
      <section
        className="py-24 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #FCEBD0 0%, #F5C08A 100%)' }}
      >
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-4xl font-bold text-primary mb-4">Stay in the Loop</h1>
        <p className="text-brown max-w-xl mx-auto text-lg">
          Get the latest news on our farmers, coffee harvests, community impact, and partnership opportunities — delivered straight to your inbox.
        </p>
      </section>

      {/* Subscribe Form */}
      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-2xl bg-peach-light p-6 shadow-sm sm:p-10">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Fresh from the source</p>
            <h2 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">Subscribe to our newsletter</h2>
            <p className="mt-3 text-sm leading-6 text-brown">
              Join our community for coffee stories, harvest news, and updates from our farming communities.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="Your email address"
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-peach-mid bg-white px-4 py-3 text-sm text-brown outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
          {error && <p role="alert" className="mx-auto mt-3 max-w-xl text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="mx-auto mt-3 max-w-xl text-center text-sm font-medium text-green-800">{message}</p>}
          <p className="mt-4 text-center text-xs text-brown/60">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* Past Issues */}
      <section className="py-16 px-6 bg-peach-light">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-primary text-2xl font-bold mb-8 text-center">Past Issues</h2>
          <div className="space-y-4">
            {pastIssues.map(issue => (
              <div key={issue.title} className="bg-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-brown font-bold text-lg mb-1">{issue.title}</h3>
                  <p className="text-brown/70 text-sm mb-2">{issue.excerpt}</p>
                  <span className="text-primary text-xs font-medium">{issue.date}</span>
                </div>
                <button className="bg-peach text-brown px-5 py-2 rounded font-medium text-sm hover:bg-primary hover:text-white transition-colors flex-shrink-0">
                  Read Issue
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
