import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LuChevronRight, LuHeart, LuShare2, LuStar } from 'react-icons/lu'
import { products, formatPrice } from '../data/products.js'
import { useCart } from '../context/useCart.js'
import ProductImage from '../components/ProductImage.jsx'

export default function ProductPage() {
  const { productId } = useParams()
  const product = products.find(item => item.id === productId)
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [showDetails, setShowDetails] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviews, setReviews] = useState([])
  const [showAllReviews, setShowAllReviews] = useState(false)

  if (!product) {
    return (
      <section className="px-6 py-20 text-center">
        <h1 className="mb-3 text-3xl font-bold text-primary">Product not found</h1>
        <p className="mb-6 text-brown">That coffee may have moved off our shelves.</p>
        <Link to="/" className="rounded bg-primary px-6 py-3 font-semibold text-white">Back to home</Link>
      </section>
    )
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
    navigate('/cart')
  }

  const handleBuyNow = () => {
    addToCart(product, quantity)
    navigate('/checkout')
  }

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: product.description,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        setShareMessage('Product shared.')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setShareMessage('Unable to share this product.')
        }
      }
      return
    }

    try {
      await navigator.clipboard.writeText(shareData.url)
      setShareMessage('Product link copied.')
    } catch {
      setShareMessage('Unable to copy the product link.')
    }
  }

  const ratingTotal = reviews.reduce((total, review) => total + review.rating, 0)
  const averageRating = reviews.length ? (ratingTotal / reviews.length).toFixed(1) : '0.0'
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
  }))
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  return (
    <section className="bg-[#fffdfa] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-brown/60 sm:mb-5">
          <Link to="/" className="font-medium transition-colors hover:text-primary">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-brown" aria-current="page">{product.name}</span>
        </nav>

        <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-peach-light shadow-sm">
            <ProductImage product={product} className="transition-transform duration-700 hover:scale-[1.03]" />
            <button
              type="button"
              aria-label={`Share ${product.name}`}
              onClick={handleShare}
              className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-black bg-white text-black shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:left-6 sm:top-6"
            >
              <LuShare2 aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isWishlisted}
              onClick={() => setIsWishlisted(current => !current)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-black bg-white text-red-600 shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-6 sm:top-6"
            >
              <LuHeart aria-hidden="true" className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="py-1">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-brown/60">{product.roast}</p>
            <h1 className="max-w-xl text-2xl font-bold leading-tight tracking-tight text-brown sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brown/75 sm:text-base">
              {product.description}
            </p>

            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-peach-mid/50 pb-4">
              <div className="flex items-baseline gap-2 justify-self-start">
                <p className="text-xl font-bold tracking-tight text-brown sm:text-2xl">{formatPrice(product.price)}</p>
                <p className="text-xs text-brown/60 sm:text-sm">per {product.weight}</p>
              </div>
              <div className="flex items-center justify-self-center overflow-hidden border border-black bg-white">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(current => Math.max(1, current - 1))}
                  className="h-11 w-11 bg-black text-xl font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brown disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>
                <input
                  id="product-quantity"
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  aria-label="Quantity"
                  onChange={event => setQuantity(Math.max(1, Math.min(99, Number(event.target.value) || 1)))}
                  className="h-11 w-14 text-center font-semibold text-brown outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= 99}
                  onClick={() => setQuantity(current => Math.min(99, current + 1))}
                  className="h-11 w-11 bg-black text-xl font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brown disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="min-h-12 bg-[#F58537] px-2 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#e8742b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F58537] sm:px-6 sm:text-sm"
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="min-h-12 border border-black bg-white px-2 py-3 text-xs font-bold text-[#d96f26] transition-colors hover:bg-[#fff3e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F58537] sm:px-6 sm:text-sm"
              >
                Buy Now
              </button>
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleShare}
                className="flex min-h-11 items-center justify-center gap-2 rounded-[5px] border border-black bg-white px-3 py-2 text-xs font-semibold text-brown transition-colors hover:bg-peach-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-sm"
              >
                <LuShare2 aria-hidden="true" className="h-4 w-4" />
                Share
              </button>
            </div>
            <p role="status" aria-live="polite" className="mt-2 min-h-5 text-xs text-brown/70">{shareMessage}</p>
          </div>
        </div>

        <div className="mt-5 border-y border-black">
          <button
            type="button"
            aria-expanded={showDetails}
            aria-controls="product-details"
            onClick={() => setShowDetails(open => !open)}
            className="flex w-full items-center justify-between py-2.5 text-left text-sm font-semibold text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span>Details</span>
            <LuChevronRight aria-hidden="true" className={`h-5 w-5 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </button>
          {showDetails && (
            <div id="product-details" className="space-y-2 pb-3 text-sm leading-5 text-black">
              <p>{product.details}</p>
              <p><span className="font-semibold">Tasting notes:</span> {product.tastingNotes}</p>
            </div>
          )}
        </div>

        <section aria-labelledby="reviews-heading" className="mt-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="reviews-heading" className="text-lg font-bold text-black">Reviews &amp; ratings</h2>
              <p className="mt-0.5 text-xs text-black">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-black" aria-label={`${averageRating} out of 5 stars`}>
              <LuStar aria-hidden="true" className="h-4 w-4 fill-[#F58537] text-[#F58537]" />
              {averageRating} / 5
            </div>
          </div>

          <div className="mb-4 max-w-sm space-y-1.5" aria-label="Rating distribution from 5 stars to 1 star">
            {ratingDistribution.map(({ rating, count }) => (
              <div key={rating} className="grid grid-cols-[2.5rem_1fr_1.5rem] items-center gap-2 text-xs text-black">
                <span className="flex items-center gap-1">{rating} <LuStar aria-hidden="true" className="h-3 w-3 fill-[#F58537] text-[#F58537]" /></span>
                <div className="h-2 overflow-hidden bg-peach-light">
                  <div
                    className="h-full bg-[#F58537]"
                    style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-right">{count}</span>
              </div>
            ))}
          </div>

          {reviews.length > 0 ? (
            <>
              <ul className="divide-y divide-peach-mid/50">
                {visibleReviews.map(review => (
                  <li key={review.id} className="py-3">
                    <div className="flex items-center gap-1 text-[#F58537]" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <LuStar key={star} aria-hidden="true" className={`h-4 w-4 ${review.rating >= star ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-black">{review.text}</p>
                  </li>
                ))}
              </ul>
              {reviews.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllReviews(show => !show)}
                  className="mb-4 mt-2 text-sm font-semibold text-black underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {showAllReviews ? 'Show fewer reviews' : 'See more reviews'}
                </button>
              )}
            </>
          ) : (
            <p className="mb-4 text-sm text-black">Be the first to review this coffee.</p>
          )}

          <form
            onSubmit={event => {
              event.preventDefault()
              if (reviewRating === 0 || !reviewText.trim()) return
              setReviews(current => [...current, { id: Date.now(), rating: reviewRating, text: reviewText.trim() }])
              setReviewRating(0)
              setReviewText('')
            }}
            className="border border-peach-mid/50 bg-white p-3 sm:p-4"
          >
            <label className="block text-xs font-semibold text-black">Your rating</label>
            <div className="mt-1 flex gap-1" role="group" aria-label="Choose a rating from 1 to 5 stars">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  aria-label={`${rating} ${rating === 1 ? 'star' : 'stars'}`}
                  aria-pressed={reviewRating === rating}
                  onClick={() => setReviewRating(rating)}
                  className="p-0.5 text-[#F58537] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                >
                  <LuStar aria-hidden="true" className={`h-5 w-5 ${reviewRating >= rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            <label htmlFor="product-review" className="mt-3 block text-xs font-semibold text-black">Your review</label>
            <textarea
              id="product-review"
              required
              rows={2}
              value={reviewText}
              onChange={event => setReviewText(event.target.value)}
              placeholder="Share your experience with this coffee"
              className="mt-1 w-full rounded border border-peach-mid px-3 py-2 text-sm text-black outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={reviewRating === 0 || !reviewText.trim()}
              className="mt-2 border border-black bg-[#F58537] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#e8742b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit review
            </button>
          </form>

        </section>

      </div>
    </section>
  )
}
