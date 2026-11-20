import { useCallback, useEffect, useState } from 'react'
import { FiArrowUpRight, FiBookOpen, FiRefreshCw } from 'react-icons/fi'
import { apiRequest } from '../context/api.js'

const SUBSTACK_URL = 'https://legacycoffee.substack.com'

function fetchPosts() {
  return apiRequest('/newsletter/substack-posts/')
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPosts(await fetchPosts())
    } catch (requestError) {
      setError(requestError.message || 'The latest stories could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchPosts()
      .then(data => {
        if (active) setPosts(data)
      })
      .catch(requestError => {
        if (active) setError(requestError.message || 'The latest stories could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-[#2f2118] px-6 py-20 text-center sm:py-24">
        <img
          src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792508243/coffee_farm.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[#2f2118]/65 to-[#2f2118]/90" />
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#e2bd8c]">From our coffee community</p>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Stories from the coffee journey</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
            Notes from our farms, the people behind every harvest, and the work of bringing Ugandan coffee to your cup.
          </p>
          <a
            href={`${SUBSTACK_URL}/subscribe`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#e2bd8c] px-6 py-3 font-semibold text-[#2f2118] transition hover:bg-white"
          >
            Subscribe on Substack <FiArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="bg-[#faf8f4] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">The latest</p>
              <h2 className="mt-2 text-3xl font-bold text-brown">From the Legacy Coffee blog</h2>
            </div>
            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              Visit our Substack <FiArrowUpRight aria-hidden="true" />
            </a>
          </div>

          {loading && (
            <p role="status" className="py-16 text-center text-brown/70">Loading the latest stories…</p>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-[#e7ddd0] bg-white px-6 py-12 text-center">
              <p className="text-lg font-semibold text-brown">We couldn't load the stories just now.</p>
              <p className="mx-auto mt-2 max-w-xl text-brown/70">{error}</p>
              <button
                type="button"
                onClick={loadPosts}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-white hover:bg-brown"
              >
                <FiRefreshCw aria-hidden="true" /> Try again
              </button>
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="rounded-2xl border border-[#e7ddd0] bg-white px-6 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2e9dd] text-primary">
                <FiBookOpen size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-2xl font-bold text-brown">Our first story is on its way</h3>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-brown/70">
                We’re getting our Substack ready. Check back soon for stories from our farms and coffee community.
              </p>
              <a
                href={`${SUBSTACK_URL}/subscribe`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
              >
                Follow Legacy Coffee on Substack <FiArrowUpRight aria-hidden="true" />
              </a>
            </div>
          )}

          {!loading && !error && posts.length > 0 && (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <article key={post.id || post.url} className="overflow-hidden rounded-2xl border border-[#e7ddd0] bg-white shadow-sm">
                  {post.image_url ? (
                    <img src={post.image_url} alt="" className="h-56 w-full object-cover" loading="lazy" />
                  ) : (
                    <div aria-hidden="true" className="flex h-56 items-center justify-center bg-gradient-to-br from-[#4d3827] to-[#a6784d]">
                      <FiBookOpen className="text-white/80" size={40} />
                    </div>
                  )}
                  <div className="p-6">
                    {post.published_at && (
                      <time dateTime={post.published_at} className="text-sm text-brown/60">
                        {formatDate(post.published_at)}
                      </time>
                    )}
                    <h3 className="mt-2 text-xl font-bold leading-snug text-brown">{post.title}</h3>
                    {post.excerpt && <p className="mt-3 line-clamp-3 leading-6 text-brown/70">{post.excerpt}</p>}
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      Read story <FiArrowUpRight aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
