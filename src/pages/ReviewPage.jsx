import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { LuStar } from 'react-icons/lu'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'
import ProductImage from '../components/ProductImage.jsx'
import useProducts from '../hooks/useProducts.js'
import { getProductUrl } from '../utils/productUrl.js'

export default function ReviewPage() {
  const { productId } = useParams()
  const { products, isLoading: isProductsLoading, error: productsError } = useProducts()
  const product = products.find(item => item.id === productId)
  const { isAuthenticated, token } = useAuth()
  const location = useLocation()
  const [eligibility, setEligibility] = useState(null)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isLoadingEligibility = Boolean(product && eligibility?.productId !== product.id)
  const productEligibility = eligibility?.productId === product?.id ? eligibility.data : null
  const eligibilityError = eligibility?.productId === product?.id ? eligibility.error : ''

  useEffect(() => {
    if (!token || !product) return undefined

    let isCurrent = true
    apiRequest(`/shop/reviews/eligibility/?product=${encodeURIComponent(product.id)}`, { token })
      .then(data => {
        if (isCurrent) {
          setEligibility({ productId: product.id, data })
          setError('')
        }
      })
      .catch(requestError => {
        if (isCurrent) {
          setEligibility({
            productId: product.id,
            data: null,
            error: `Could not check review eligibility: ${requestError.message}`,
          })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [product, token])

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  }

  if ((isProductsLoading && !product) || (product && isLoadingEligibility)) {
    return <section role="status" className="px-6 py-20 text-center text-brown">Checking your order…</section>
  }

  if ((productsError && !product) || eligibilityError || error) {
    return (
      <section role="alert" className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-brown">Review unavailable</h1>
        <p className="mt-3 text-sm text-brown/70">{error || eligibilityError || `Could not load products: ${productsError}`}</p>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center bg-[#593a27] px-5 py-3 text-sm font-semibold text-white">Back to home</Link>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-brown">Coffee not found</h1>
        <p className="mt-3 text-sm text-brown/70">This product may no longer be available for review.</p>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center bg-[#593a27] px-5 py-3 text-sm font-semibold text-white">Back to home</Link>
      </section>
    )
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await apiRequest('/shop/reviews/', {
        method: 'POST',
        token,
        body: {
          product: product.id,
          rating,
          text: reviewText.trim(),
        },
      })
      setSuccess(true)
      setEligibility(current => current
        ? { ...current, data: { ...current.data, has_reviewed: true, can_review: false } }
        : current)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="min-h-[60vh] bg-[#fffdfa] px-4 py-9 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link to={getProductUrl(product)} className="text-sm font-semibold text-[#70432d] hover:underline">
          ← Back to {product.name}
        </Link>
        <div className="mt-5 grid gap-6 border border-peach-mid/50 bg-white p-5 shadow-sm sm:grid-cols-[10rem_1fr] sm:p-7">
          <div className="relative aspect-square overflow-hidden bg-peach-light">
            <ProductImage product={product} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Verified customer review</p>
            <h1 className="mt-2 text-2xl font-bold text-brown sm:text-3xl">Rate {product.name}</h1>
            <p className="mt-2 text-sm leading-6 text-brown/70">
              Reviews are available only for products in your fulfilled orders.
            </p>

            {success ? (
              <div role="status" className="mt-6 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Thank you. Your rating and review have been submitted.
                <Link to={getProductUrl(product)} className="ml-1 font-semibold underline">View the coffee</Link>
              </div>
            ) : productEligibility?.can_review ? (
              <form onSubmit={handleSubmit} className="mt-6">
                <label className="block text-sm font-semibold text-brown">Your rating</label>
                <div className="mt-2 flex gap-2" role="group" aria-label="Choose a rating from 1 to 5 stars">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                      aria-pressed={rating === value}
                      onClick={() => setRating(value)}
                      className="p-1 text-[#F58537] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <LuStar aria-hidden="true" className={`h-7 w-7 ${rating >= value ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                <label htmlFor="review-text" className="mt-4 block text-sm font-semibold text-brown">Your review</label>
                <textarea
                  id="review-text"
                  required
                  maxLength={2000}
                  rows={5}
                  value={reviewText}
                  onChange={event => setReviewText(event.target.value)}
                  placeholder="Share your experience with this coffee"
                  className="mt-2 w-full border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
                />
                {error && <p role="alert" className="mt-3 border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</p>}
                <button
                  type="submit"
                  disabled={rating === 0 || !reviewText.trim() || isSubmitting}
                  className="mt-4 min-h-11 bg-[#593a27] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#40291d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting review…' : 'Submit review'}
                </button>
              </form>
            ) : productEligibility?.has_reviewed ? (
              <p className="mt-6 border border-peach-mid/50 bg-[#fffdfa] p-4 text-sm text-brown/75">You have already reviewed this coffee.</p>
            ) : (
              <p className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                This coffee can be reviewed after it appears in an order marked fulfilled.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
