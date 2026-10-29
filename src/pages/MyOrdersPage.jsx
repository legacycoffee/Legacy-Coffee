import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { LuArrowRight, LuPackage, LuPackageCheck, LuClock3, LuCircleX } from 'react-icons/lu'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'
import { formatPrice } from '../data/products.js'
import OrderInvoiceActions from '../components/OrderInvoiceActions.jsx'
import { getOrderUrl } from '../utils/orderUrl.js'

const statusStyles = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  confirmed: 'bg-blue-50 text-blue-800 ring-blue-200',
  fulfilled: 'bg-green-50 text-green-800 ring-green-200',
  cancelled: 'bg-red-50 text-red-800 ring-red-200',
}

const statusIcons = {
  pending: LuClock3,
  confirmed: LuPackage,
  fulfilled: LuPackageCheck,
  cancelled: LuCircleX,
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Kampala',
  }).format(new Date(value))
}

function StatusBadge({ status, label }) {
  const StatusIcon = statusIcons[status] || LuPackage
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[status] || 'bg-stone-50 text-stone-700 ring-stone-200'}`}>
      <StatusIcon aria-hidden="true" className="h-3.5 w-3.5" />
      {label || status.replaceAll('_', ' ')}
    </span>
  )
}

export default function MyOrdersPage() {
  const { isAuthenticated, token } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { orderKey, orderSlug } = useParams()
  const [orderPage, setOrderPage] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [selectedPublicId, setSelectedPublicId] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) return undefined

    let isCurrent = true
    const loadOrders = async () => {
      setError('')
      try {
        const data = await apiRequest(`/orders/mine/?page=${pageNumber}`, { token })
        let results = data.results
        if (orderKey && !results.some(order => order.public_id === orderKey)) {
          const selectedOrder = await apiRequest(
            `/orders/mine/${encodeURIComponent(orderKey)}/`,
            { token },
          )
          results = [...results, selectedOrder]
        }
        if (!isCurrent) return

        setOrderPage({ ...data, results })
        if (orderKey) {
          const selectedOrder = results.find(order => order.public_id === orderKey)
          setSelectedPublicId(selectedOrder.public_id)
          const canonicalUrl = getOrderUrl(selectedOrder)
          if (location.pathname !== canonicalUrl) {
            navigate(canonicalUrl, { replace: true })
          }
        } else {
          setSelectedPublicId(current => (
            results.some(order => order.public_id === current)
              ? current
              : results[0]?.public_id ?? null
          ))
        }
      } catch (requestError) {
        if (isCurrent) setError(requestError.message)
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }
    loadOrders()

    return () => {
      isCurrent = false
    }
  }, [location.pathname, navigate, orderKey, orderSlug, pageNumber, token])

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  }

  const orders = orderPage?.results ?? []
  const selectedOrder = orderKey
    ? orders.find(order => order.public_id === orderKey)
    : orders.find(order => order.public_id === selectedPublicId) ?? orders[0]

  return (
    <section className="min-h-[55vh] bg-[#fffdfa] px-4 py-9 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl lg:max-w-none">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">Your account</p>
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">My orders</h1>
            <p className="mt-2 text-sm text-black/65">View your order history and follow each order’s status.</p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Shop coffee <LuArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        {error && (
          <p role="alert" className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Could not load your orders: {error}
          </p>
        )}
        {isLoading && <p role="status" className="py-8 text-center text-sm text-black/60">Loading your orders…</p>}

        {!isLoading && !error && orderPage?.results.length === 0 && (
          <div className="border border-peach-mid/50 bg-white px-5 py-12 text-center shadow-sm">
            <LuPackage aria-hidden="true" className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-xl font-bold text-black">No orders yet</h2>
            <p className="mt-2 text-sm text-black/65">Your orders will appear here after you place one.</p>
            <Link to="/" className="mt-5 inline-flex bg-[#F58537] px-5 py-3 text-sm font-bold text-white hover:bg-[#e8742b]">
              Browse coffee
            </Link>
          </div>
        )}

        {!isLoading && !error && orderPage?.results.length > 0 && (
          <>
            <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.38fr)_minmax(0,1fr)]">
              <nav aria-label="Your orders" className="space-y-3">
                {orders.map(order => {
                  const isSelected = order.reference === selectedOrder?.reference
                  return (
                    <button
                      key={order.reference}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedPublicId(order.public_id)
                        navigate(getOrderUrl(order))
                      }}
                      className={`w-full border p-4 text-left shadow-sm transition-colors ${
                        isSelected
                          ? 'border-primary bg-peach-light/30'
                          : 'border-peach-mid/50 bg-white hover:border-primary/50'
                      }`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span>
                          <span className="block font-bold text-black">Order {order.reference}</span>
                          <span className="mt-1 block text-xs text-black/60">{formatDate(order.created_at)}</span>
                        </span>
                        <StatusBadge status={order.status} label={order.status_label} />
                      </span>
                      <span className="mt-3 block text-sm font-semibold text-black">
                        {formatPrice(Number(order.total))}
                      </span>
                    </button>
                  )
                })}
              </nav>

              {selectedOrder && (
                <article className="border border-peach-mid/50 bg-white p-4 shadow-sm sm:p-6">
                  <header className="flex flex-wrap items-start justify-between gap-3 border-b border-peach-mid/40 pb-4">
                    <div>
                      <h2 className="font-bold text-black">Order {selectedOrder.reference}</h2>
                      <p className="mt-1 text-xs text-black/60">Placed {formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={selectedOrder.status} label={selectedOrder.status_label} />
                      <OrderInvoiceActions reference={selectedOrder.reference} token={token} />
                    </div>
                  </header>

                  <ul className="space-y-3 py-4">
                    {selectedOrder.items.map((item, index) => (
                      <li key={`${item.product_name}-${index}`} className="flex gap-4 border-b border-peach-mid/30 pb-3 text-sm last:border-0">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_image_alt || item.product_name}
                            className="h-20 w-20 shrink-0 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center bg-peach-light/40">
                            <LuPackage className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-wrap justify-between gap-3">
                          <div>
                            <p className="font-semibold text-black">{item.product_name}</p>
                            <p className="mt-1 text-black/65">{item.weight} · Qty {item.quantity}</p>
                            <p className="mt-1 text-xs text-black/55">{formatPrice(Number(item.unit_price))} each</p>
                          </div>
                          <p className="shrink-0 font-medium text-black">{formatPrice(Number(item.line_total))}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="grid gap-5 border-t border-peach-mid/40 pt-4 sm:grid-cols-2">
                    <dl className="sm:col-span-2">
                      <dt className="text-xs font-bold text-black/70">Customer</dt>
                      <div className="mt-2 grid gap-3 sm:grid-cols-3">
                        <dd className="text-sm font-normal text-black">{selectedOrder.customer_name}</dd>
                        <dd className="break-all text-sm font-normal text-black">{selectedOrder.customer_email}</dd>
                        <dd className="text-sm font-normal text-black">{selectedOrder.customer_phone}</dd>
                      </div>
                    </dl>
                    <dl>
                      <dt className="text-xs font-bold text-black/70">Delivery address</dt>
                      <dd className="mt-1 text-sm font-normal text-black">
                        {selectedOrder.delivery_address}, {selectedOrder.delivery_city}
                      </dd>
                      {selectedOrder.delivery_latitude && selectedOrder.delivery_longitude && (
                        <dd className="mt-1 text-xs text-black/60">
                          Device coordinates: {selectedOrder.delivery_latitude}, {selectedOrder.delivery_longitude}
                        </dd>
                      )}
                      {selectedOrder.delivery_notes && (
                        <dd className="mt-1 whitespace-pre-line text-sm font-normal text-black/75">
                          Delivery notes: {selectedOrder.delivery_notes}
                        </dd>
                      )}
                    </dl>
                    <div className="border-t border-peach-mid/40 bg-peach-light/30 px-4 py-3 text-left sm:col-span-2">
                      <dl className="sm:flex sm:items-center sm:justify-between sm:gap-4">
                        <dt className="text-xs font-bold text-black/70">Order total</dt>
                        <dd className="mt-1 text-xl font-bold tabular-nums text-black sm:mt-0 sm:text-right">
                          {formatPrice(Number(selectedOrder.total))}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </article>
              )}
            </div>

            {orderPage.count > 20 && (
              <nav aria-label="Order history pages" className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  disabled={!orderPage.previous}
                  onClick={() => {
                    setError('')
                    setIsLoading(true)
                    setPageNumber(current => current - 1)
                  }}
                  className="border border-black px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-black/60">Page {pageNumber} · {orderPage.count} orders</span>
                <button
                  type="button"
                  disabled={!orderPage.next}
                  onClick={() => {
                    setError('')
                    setIsLoading(true)
                    setPageNumber(current => current + 1)
                  }}
                  className="border border-black px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  )
}
