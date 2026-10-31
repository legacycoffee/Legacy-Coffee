import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { LuArrowRight, LuHeart, LuTrash2 } from 'react-icons/lu'
import { formatPrice } from '../data/products.js'
import ProductImage from '../components/ProductImage.jsx'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'
import { getProductUrl } from '../utils/productUrl.js'

export default function WishlistPage() {
  const { isAuthenticated, token } = useAuth()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined

    let isCurrent = true
    apiRequest('/shop/wishlist/', { token })
      .then(data => {
        if (isCurrent) {
          setItems(data)
          window.dispatchEvent(new CustomEvent('legacy-wishlist-updated', {
            detail: { count: data.length },
          }))
        }
      })
      .catch(requestError => {
        if (isCurrent) setError(`Could not load your wishlist: ${requestError.message}`)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [isAuthenticated, token])

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/wishlist' }} />
  }

  const removeItem = async item => {
    setError('')
    setRemovingId(item.product.id)
    try {
      await apiRequest(`/shop/wishlist/${encodeURIComponent(item.product.id)}/`, {
        method: 'DELETE',
        token,
      })
      const nextItems = items.filter(savedItem => savedItem.product.id !== item.product.id)
      setItems(nextItems)
      window.dispatchEvent(new CustomEvent('legacy-wishlist-updated', {
        detail: { count: nextItems.length },
      }))
    } catch (requestError) {
      setError(`Could not remove ${item.product.name} from your wishlist: ${requestError.message}`)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section className="min-h-[55vh] bg-[#fffdfa] px-4 py-9 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">Saved for later</p>
        <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">My wishlist</h1>

        {error && (
          <p role="alert" className="mt-5 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {isLoading ? (
          <p role="status" className="mt-8 text-sm text-black/70">Loading your wishlist…</p>
        ) : items.length === 0 ? (
          <div className="mt-7 border border-peach-mid/50 bg-white px-6 py-12 text-center shadow-sm">
            <LuHeart aria-hidden="true" className="mx-auto h-9 w-9 text-red-600" />
            <h2 className="mt-3 text-xl font-bold text-black">Your wishlist is empty</h2>
            <p className="mt-2 text-sm text-black/70">Save products you like and they’ll be waiting here.</p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brown"
            >
              Browse coffee <LuArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(item => {
              const product = {
                ...item.product,
                imageAlt: item.product.image_alt,
              }

              return (
                <li key={item.id} className="flex flex-col border border-peach-mid/50 bg-white p-4 shadow-sm">
                  <Link to={getProductUrl(product)} className="aspect-[4/3] overflow-hidden bg-peach-light">
                    <ProductImage product={product} />
                  </Link>
                  <div className="flex flex-1 items-start justify-between gap-3 pt-4">
                    <div className="min-w-0">
                      <Link
                        to={getProductUrl(product)}
                        className="font-bold text-black transition-colors hover:text-primary"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 text-sm text-black/65">{product.weight}</p>
                      <p className="mt-2 text-sm font-semibold text-black">{formatPrice(Number(product.price))}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      disabled={removingId !== null}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-primary transition-colors hover:bg-peach-light disabled:cursor-wait disabled:opacity-50"
                    >
                      <LuTrash2 aria-hidden="true" className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
