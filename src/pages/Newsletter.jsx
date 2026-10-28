import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiRequest } from '../context/api.js'

function getIssueExcerpt(contentHtml) {
  const document = new DOMParser().parseFromString(contentHtml, 'text/html')
  const text = document.body.textContent?.replace(/\s+/g, ' ').trim() || ''
  return text.length > 220 ? `${text.slice(0, 217).trimEnd()}...` : text
}

function formatIssueDate(sentAt) {
  return new Date(sentAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function Newsletter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [pastIssues, setPastIssues] = useState([])
  const [archiveError, setArchiveError] = useState('')
  const [isLoadingIssues, setIsLoadingIssues] = useState(true)
  const [openIssueId, setOpenIssueId] = useState(null)
  const unsubscribeToken = searchParams.get('unsubscribe')
  const [unsubscribeMessage, setUnsubscribeMessage] = useState('')
  const [unsubscribeError, setUnsubscribeError] = useState('')
  const [isUnsubscribing, setIsUnsubscribing] = useState(false)

  useEffect(() => {
    let isCurrent = true
    apiRequest('/newsletter/issues/')
      .then(issues => {
        if (isCurrent) setPastIssues(Array.isArray(issues) ? issues : [])
      })
      .catch(requestError => {
        if (isCurrent) setArchiveError(requestError.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoadingIssues(false)
      })
    return () => {
      isCurrent = false
    }
  }, [])

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
      <section className="bg-[#f4eee8] px-4 py-8 sm:px-6 sm:py-12">
        <div className="relative mx-auto flex min-h-56 max-w-7xl items-center justify-center overflow-hidden bg-[#2b211b] bg-cover bg-center px-6 py-14 text-center sm:min-h-72 sm:py-20"
          style={{ backgroundImage: "linear-gradient(rgba(43, 33, 27, 0.62), rgba(43, 33, 27, 0.62)), url('https://res.cloudinary.com/vgko5mna/image/upload/v1792514667/coffee_1_farm.jpg')" }}
        >
          <h1 className="relative text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Stay in the loop
          </h1>
        </div>
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
          {isLoadingIssues ? (
            <p role="status" className="text-center text-sm text-brown/70">Loading past issues…</p>
          ) : archiveError ? (
            <p role="alert" className="mx-auto max-w-2xl text-center text-sm text-red-700">
              Could not load past issues: {archiveError}
            </p>
          ) : pastIssues.length === 0 ? (
            <p className="text-center text-sm text-brown/70">No past issues are available yet. Check back soon.</p>
          ) : (
            <div className="space-y-4">
              {pastIssues.map(issue => {
                const isOpen = openIssueId === issue.id
                return (
                  <article key={issue.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center">
                      <div className="flex-1">
                        <h3 className="mb-1 text-lg font-bold text-brown">{issue.subject}</h3>
                        <p className="mb-2 text-sm text-brown/70">{getIssueExcerpt(issue.content_html)}</p>
                        <time dateTime={issue.sent_at} className="text-xs font-medium text-primary">
                          {formatIssueDate(issue.sent_at)}
                        </time>
                      </div>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenIssueId(isOpen ? null : issue.id)}
                        className="flex-shrink-0 rounded bg-peach px-5 py-2 text-sm font-medium text-brown transition-colors hover:bg-primary hover:text-white"
                      >
                        {isOpen ? 'Close Issue' : 'Read Issue'}
                      </button>
                    </div>
                    {isOpen && (
                      <div
                        className="newsletter-editor border-t border-peach-mid/40 px-6 py-6 text-sm leading-7 text-brown sm:px-8"
                        dangerouslySetInnerHTML={{ __html: issue.content_html }}
                      />
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
