import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiRequest } from '../context/api.js'

const pastIssues = [
  { title: 'Harvest Season 2024 Recap', date: 'December 2024', excerpt: 'A record-breaking harvest season with over 50,000kg of premium coffee collected from our farmer network.' },
  { title: 'Women in Coffee Initiative Launch', date: 'October 2024', excerpt: 'We launched our women empowerment program, enrolling 80 women farmers in our first cohort.' },
  { title: 'New Export Partnership Announced', date: 'August 2024', excerpt: 'Legacy Coffee signs a landmark export deal to bring Ugandan coffee to European markets.' },
]

export default function Newsletter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const unsubscribeToken = searchParams.get('unsubscribe')
  const [unsubscribeMessage, setUnsubscribeMessage] = useState('')
  const [unsubscribeError, setUnsubscribeError] = useState('')
  const [isUnsubscribing, setIsUnsubscribing] = useState(false)

  const handleUnsubscribe = async () => {
    setIsUnsubscribing(true)
    setUnsubscribeError('')
    try {
      const response = await apiRequest('/newsletter/unsubscribe/', {
        method: 'POST',
        body: { token: unsubscribeToken },
      })
      setUnsubscribeMessage(response.message)
      setSearchParams(current => {
        const next = new URLSearchParams(current)
        next.delete('unsubscribe')
        return next
      }, { replace: true })
    } catch (requestError) {
      setUnsubscribeError(requestError.message)
    } finally {
      setIsUnsubscribing(false)
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

      {unsubscribeToken && (
        <section aria-labelledby="unsubscribe-heading" className="bg-white px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-3xl border border-peach-mid/50 bg-peach-light p-5 sm:p-7">
            <h2 id="unsubscribe-heading" className="text-xl font-bold text-brown">Unsubscribe from email updates?</h2>
            <p className="mt-2 text-sm leading-6 text-brown/75">
              Confirm below to stop receiving Legacy Coffee newsletter emails.
            </p>
            {unsubscribeError && <p role="alert" className="mt-3 text-sm text-red-700">{unsubscribeError}</p>}
            {unsubscribeMessage ? (
              <p role="status" className="mt-3 text-sm font-semibold text-green-800">{unsubscribeMessage}</p>
            ) : (
              <button
                type="button"
                disabled={isUnsubscribing}
                onClick={handleUnsubscribe}
                className="mt-4 min-h-11 bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60"
              >
                {isUnsubscribing ? 'Unsubscribing…' : 'Confirm unsubscribe'}
              </button>
            )}
          </div>
        </section>
      )}

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
