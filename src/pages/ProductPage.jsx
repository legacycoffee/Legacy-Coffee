import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { LuChevronRight, LuHeart, LuShare2, LuStar } from 'react-icons/lu'
import { formatPrice } from '../data/products.js'
import { useCart } from '../context/useCart.js'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'
import ProductImage from '../components/ProductImage.jsx'
import useProducts from '../hooks/useProducts.js'

export default function ProductPage() {
  const { productId } = useParams()
  const { products, isLoading: isProductsLoading, error: productsError } = useProducts()
  const product = products.find(item => item.id === productId)
  const { addToCart } = useCart()
  const { isAuthenticated, token } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [cartMessage, setCartMessage] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [wishlistProductIds, setWishlistProductIds] = useState([])
  const [wishlistMessage, setWishlistMessage] = useState('')
  const [isWishlistSaving, setIsWishlistSaving] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [reviewData, setReviewData] = useState(null)
  const [reviewError, setReviewError] = useState('')
  const [showAllReviews, setShowAllReviews] = useState(false)
  const isWishlisted = Boolean(isAuthenticated && wishlistProductIds.includes(productId))
  const currentReviewData = reviewData?.productId === productId ? reviewData : null
  const reviews = currentReviewData?.reviews ?? []
  const reviewEligibility = currentReviewData?.eligibility ?? null

  useEffect(() => {
    if (!token || !product) return undefined

    let isCurrent = true
    apiRequest('/shop/wishlist/', { token })
      .then(items => {
        if (isCurrent) {
          setWishlistProductIds(items.map(item => item.product.id))
          setWishlistMessage('')
        }
      })
      .catch(error => {
        if (isCurrent) setWishlistMessage(`Could not load your wishlist: ${error.message}`)
      })

    return () => {
      isCurrent = false
    }
  }, [product, token])

  useEffect(() => {
    if (!product) return undefined

    let isCurrent = true
    const reviewsRequest = apiRequest(`/shop/products/${product.id}/reviews/`)
    const eligibilityRequest = token
      ? apiRequest(`/shop/reviews/eligibility/?product=${encodeURIComponent(product.id)}`, { token })
      : Promise.resolve(null)

    Promise.all([reviewsRequest, eligibilityRequest])
      .then(([nextReviews, eligibility]) => {
        if (isCurrent) {
          setReviewData({ productId: product.id, reviews: nextReviews, eligibility })
          setReviewError('')
        }
      })
      .catch(error => {
        if (isCurrent) {
          setReviewData({ productId: product.id, reviews: [], eligibility: null })
          setReviewError(`Could not load product reviews: ${error.message}`)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [product, token])

  if (isProductsLoading) {
    return <section role="status" className="px-6 py-20 text-center text-brown">Loading product…</section>
  }

  if (productsError) {
    return (
      <section role="alert" className="px-6 py-20 text-center">
        <h1 className="mb-3 text-3xl font-bold text-primary">Products unavailable</h1>
        <p className="mb-6 text-brown">Could not load this product: {productsError}</p>
        <Link to="/" className="rounded bg-primary px-6 py-3 font-semibold text-white">Back to home</Link>
      </section>
    )
  }

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
    setCartMessage(`${quantity} ${quantity === 1 ? 'item' : 'items'} added to your cart.`)
  }

  const handleBuyNow = () => {
    addToCart(product, quantity)
    navigate('/cart')
  }

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/signin', { state: { from: location.pathname } })
      return
    }

    setWishlistMessage('')
    setIsWishlistSaving(true)
    try {
      if (isWishlisted) {
        await apiRequest(`/shop/wishlist/${product.id}/`, { method: 'DELETE', token })
        setWishlistProductIds(current => current.filter(id => id !== product.id))
      } else {
        await apiRequest('/shop/wishlist/', {
          method: 'POST',
          token,
          body: { product_id: product.id },
        })
        setWishlistProductIds(current => current.includes(product.id) ? current : [...current, product.id])
      }
    } catch (error) {
      setWishlistMessage(`Could not update your wishlist: ${error.message}`)
    } finally {
      setIsWishlistSaving(false)
    }
  }

  const productUrl = window.location.href

  const handleNativeShare = async () => {
    setShareMessage('')
    if (!navigator.share) {
      try {
        await navigator.clipboard.writeText(productUrl)
        setShareMessage('Sharing is not supported here, so the product link was copied.')
      } catch {
        setShareMessage('Sharing is not supported here. Copy the product link from your browser address bar.')
      }
      return
    }

    try {
      await navigator.share({ title: product.name, text: product.description, url: productUrl })
      const tracked = await recordShare('native')
      setShareMessage(tracked
        ? 'Product link shared.'
        : 'Product was shared, but share tracking failed.')
    } catch (error) {
      if (error.name !== 'AbortError') setShareMessage('Unable to share the product link.')
    }
  }

  const recordShare = async channel => {
    try {
      await apiRequest('/shop/share-events/', {
        method: 'POST',
        token,
        body: { product_id: product.id, channel },
      })
      return true
    } catch (error) {
      setShareMessage(`Product share tracking failed: ${error.message}`)
      return false
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
      <div className="mx-auto max-w-7xl lg:max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-brown/60 sm:mb-5">
          <Link to="/" className="font-medium transition-colors hover:text-primary">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-brown" aria-current="page">{product.name}</span>
        </nav>

        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-peach-light shadow-sm lg:w-full lg:max-w-[400px] lg:justify-self-center">
            <ProductImage product={product} className="transition-transform duration-700 sm:hover:scale-[1.03]" />
            <button
              type="button"
              aria-label={`Share ${product.name}`}
              onClick={handleNativeShare}
              className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-black bg-white text-black shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:left-6 sm:top-6"
            >
              <LuShare2 aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isWishlisted}
              disabled={isWishlistSaving}
              onClick={handleToggleWishlist}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-black bg-white text-red-600 shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 sm:right-6 sm:top-6"
            >
              <LuHeart aria-hidden="true" className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="py-1 lg:mx-auto lg:w-full lg:max-w-[400px] lg:py-0">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-brown/60 lg:mb-1">{product.roast}</p>
            <h1 className="max-w-xl text-2xl font-bold leading-tight tracking-tight text-brown sm:text-3xl lg:text-2xl">
              {product.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brown/75 sm:text-base lg:mt-2 lg:text-sm lg:leading-5">
              {product.description}
            </p>

            <div className="mt-4 grid grid-cols-1 items-center gap-2 border-b border-peach-mid/50 pb-4 lg:mt-3 lg:flex lg:flex-col lg:items-start lg:gap-3 lg:pb-3">
              <div className="flex items-baseline gap-2 justify-self-start">
                <p className="text-xl font-bold tracking-tight text-brown sm:text-2xl lg:whitespace-nowrap">{formatPrice(product.price)}</p>
                <p className="text-xs text-brown/60 sm:text-sm lg:whitespace-nowrap">per {product.weight}</p>
              </div>
              <div className="flex items-center justify-self-center overflow-hidden border border-black bg-white lg:self-center">
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

            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:mt-3">
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
            {cartMessage && (
              <p role="status" aria-live="polite" className="mt-3 text-sm text-brown">
                {cartMessage}{' '}
                <Link to="/cart" className="font-semibold text-primary underline underline-offset-2">View cart</Link>
              </p>
            )}
            <div className="mt-2 flex justify-end lg:mt-1">
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex min-h-11 items-center justify-center gap-2 rounded-[5px] border border-black bg-white px-3 py-2 text-xs font-semibold text-brown transition-colors hover:bg-peach-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-sm"
              >
                <LuShare2 aria-hidden="true" className="h-4 w-4" />
                Share
              </button>
            </div>
            {shareMessage && <p role="status" aria-live="polite" className="mt-2 min-h-5 text-xs text-brown/70">{shareMessage}</p>}
            {wishlistMessage && <p role="status" aria-live="polite" className="mt-2 min-h-5 text-xs text-red-700">{wishlistMessage}</p>}
          </div>
        </div>

        <div className="relative mt-5 border-y border-black lg:ml-auto lg:max-w-[400px]">
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
            <div id="product-details" className="space-y-2 pb-3 text-sm leading-5 text-black lg:absolute lg:right-0 lg:top-full lg:z-20 lg:w-full lg:border lg:border-peach-mid/60 lg:bg-white lg:p-4 lg:shadow-lg">
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

          {reviewError && <p role="alert" className="mb-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{reviewError}</p>}
          {!currentReviewData ? (
            <p role="status" className="mb-4 text-sm text-black/65">Loading reviews…</p>
          ) : reviews.length > 0 ? (
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
          ) : null}

          {isAuthenticated && currentReviewData && reviewEligibility?.can_review ? (
            <Link
              to={`/review/${encodeURIComponent(product.id)}`}
              className="inline-flex min-h-11 items-center border border-[#593a27] bg-[#593a27] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#40291d]"
            >
              Rate and review this coffee
            </Link>
          ) : isAuthenticated && reviewEligibility?.has_reviewed ? (
            <p className="border border-peach-mid/50 bg-white p-4 text-sm text-black/70">You’ve already reviewed this coffee.</p>
          ) : isAuthenticated && currentReviewData && reviewEligibility ? (
            <p className="border border-peach-mid/50 bg-white p-4 text-sm text-black/70">
              You can rate and review this coffee after your order is marked fulfilled.
            </p>
          ) : null}

        </section>

      </div>
    </section>
  )
}
