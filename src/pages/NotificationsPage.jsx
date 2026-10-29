import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'
import OrderInvoiceActions from '../components/OrderInvoiceActions.jsx'

function formatNotificationDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function NotificationsPage() {
  const { isAuthenticated, token } = useAuth()
  const navigate = useNavigate()
  const { notificationId } = useParams()
  const [notifications, setNotifications] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = useCallback(async () => {
    setError('')
    try {
      const data = await apiRequest('/auth/notifications/', { token })
      setNotifications(data.results)
      setSelectedId(currentId => (
        data.results.some(notification => notification.id === currentId)
          ? currentId
          : window.matchMedia('(min-width: 1024px)').matches
            ? data.results[0]?.id ?? null
            : null
      ))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isAuthenticated) loadNotifications()
  }, [isAuthenticated, loadNotifications])

  useEffect(() => {
    if (notificationId) {
      setSelectedId(Number(notificationId))
    } else if (!window.matchMedia('(min-width: 1024px)').matches) {
      setSelectedId(null)
    }
  }, [notificationId])

  const selectedNotification = notifications.find(item => item.id === selectedId)

  const openNotification = notification => {
    setSelectedId(notification.id)
    navigate(`/notifications/${notification.id}`)
  }

  const closeNotification = () => {
    setSelectedId(null)
    navigate('/notifications')
  }

  useEffect(() => {
    if (!selectedNotification || selectedNotification.is_read) return
    setError('')
    let isCurrent = true
    apiRequest(`/auth/notifications/${selectedNotification.id}/read/`, {
      method: 'PATCH',
      token,
    }).then(response => {
      if (!isCurrent) return
      setNotifications(current => current.map(item => (
        item.id === selectedNotification.id ? { ...item, is_read: true } : item
      )))
      window.dispatchEvent(new CustomEvent('legacy-notifications-updated', {
        detail: { unreadCount: response.unread_count },
      }))
    }).catch(requestError => {
      if (isCurrent) setError(requestError.message)
    })
    return () => { isCurrent = false }
  }, [selectedNotification, token])

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/notifications' }} />
  }

  return (
    <section className="min-h-[60vh] bg-[#fffdfa] px-4 py-9 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-7xl">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">Your account</p>
        <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">Notifications</h1>
        <p className="mt-2 text-sm text-black/65">Order updates, review reminders, and account messages.</p>

        {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        <div className="mt-7 grid min-h-[28rem] gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.6fr)]">
          <section
            aria-label="Notification list"
            className={`border border-peach-mid/50 bg-white shadow-sm ${
              notificationId ? 'hidden lg:block' : ''
            }`}
          >
            <h2 className="border-b border-peach-mid/40 px-5 py-4 font-bold text-black">All notifications</h2>
            {isLoading ? (
              <p className="px-5 py-6 text-sm text-black/60">Loading notifications…</p>
            ) : notifications.length === 0 ? (
              <p className="px-5 py-6 text-sm text-black/60">You don’t have any notifications yet.</p>
            ) : (
              <ul className="max-h-[34rem] divide-y divide-peach-mid/30 overflow-y-auto">
                {notifications.map(notification => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      aria-current={selectedId === notification.id ? 'true' : undefined}
                      onClick={() => openNotification(notification)}
                      className={`flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-peach-light/40 ${
                        selectedId === notification.id ? 'bg-peach-light/50' : ''
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.is_read ? 'bg-transparent' : 'bg-red-600'}`}
                      />
                      <span className="min-w-0 flex-1">
                        {notification.details?.items?.[0]?.image && (
                          <img
                            src={notification.details.items[0].image}
                            alt={notification.details.items[0].image_alt || notification.details.items[0].name}
                            className="mb-2 h-12 w-12 rounded object-cover"
                          />
                        )}
                        <span className={`block text-sm ${notification.is_read ? 'font-medium' : 'font-bold'} text-black`}>
                          {notification.title}
                        </span>
                        <span className="mt-1 block truncate text-xs text-black/60">{notification.message}</span>
                        <time dateTime={notification.created_at} className="mt-2 block text-xs text-black/50">
                          {formatNotificationDate(notification.created_at)}
                        </time>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-label="Selected notification"
            className={`border border-peach-mid/50 bg-white p-5 shadow-sm sm:p-7 ${
              notificationId ? '' : 'hidden lg:block'
            }`}
          >
            {selectedNotification ? (
              <article>
                <button
                  type="button"
                  onClick={closeNotification}
                  className="mb-5 text-sm font-semibold text-primary hover:underline lg:hidden"
                >
                  ← Back to notifications
                </button>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  {selectedNotification.is_read ? 'Notification' : 'New notification'}
                </p>
                <h2 className="mt-2 text-xl font-bold text-black sm:text-2xl">{selectedNotification.title}</h2>
                <time dateTime={selectedNotification.created_at} className="mt-2 block text-sm text-black/55">
                  {formatNotificationDate(selectedNotification.created_at)}
                </time>
                {selectedNotification.details?.reference ? (
                  <div className="mt-6 border-t border-peach-mid/40 pt-5">
                    <h3 className="font-bold text-black">Order details</h3>
                    <div className="mt-4">
                      <OrderInvoiceActions
                        reference={selectedNotification.details.reference}
                        token={token}
                      />
                    </div>
                    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold text-black/55">Order number</dt>
                        <dd className="mt-1 font-semibold text-black">{selectedNotification.details.reference}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-black/55">Order status</dt>
                        <dd className="mt-1 capitalize text-black">{selectedNotification.details.status}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-black/55">Customer</dt>
                        <dd className="mt-1 text-black">{selectedNotification.details.customer_name}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-black/55">Email</dt>
                        <dd className="mt-1 break-all text-black">{selectedNotification.details.customer_email}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-black/55">Phone</dt>
                        <dd className="mt-1 text-black">{selectedNotification.details.customer_phone}</dd>
                      </div>
                      {selectedNotification.details.business_name && (
                        <div>
                          <dt className="text-xs font-semibold text-black/55">Business</dt>
                          <dd className="mt-1 text-black">{selectedNotification.details.business_name}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs font-semibold text-black/55">Delivery location</dt>
                        <dd className="mt-1 text-black">
                          {[selectedNotification.details.delivery_address, selectedNotification.details.delivery_city].filter(Boolean).join(', ')}
                        </dd>
                      </div>
                      {selectedNotification.details.delivery_notes && (
                        <div className="sm:col-span-2">
                          <dt className="text-xs font-semibold text-black/55">Delivery notes</dt>
                          <dd className="mt-1 whitespace-pre-line text-black">{selectedNotification.details.delivery_notes}</dd>
                        </div>
                      )}
                      {(selectedNotification.details.delivery_latitude || selectedNotification.details.delivery_longitude) && (
                        <div className="sm:col-span-2">
                          <dt className="text-xs font-semibold text-black/55">Delivery coordinates</dt>
                          <dd className="mt-1 text-black">
                            {[selectedNotification.details.delivery_latitude, selectedNotification.details.delivery_longitude].filter(Boolean).join(', ')}
                          </dd>
                        </div>
                      )}
                    </dl>
                    <h3 className="mt-6 font-bold text-black">Items</h3>
                    <ul className="mt-3 divide-y divide-peach-mid/30 border-y border-peach-mid/30">
                      {selectedNotification.details.items.map((item, index) => (
                        <li key={`${item.name}-${index}`} className="flex items-center gap-4 py-4">
                          {item.image ? (
                            <img src={item.image} alt={item.image_alt || item.name} className="h-16 w-16 shrink-0 rounded object-cover" />
                          ) : (
                            <div aria-hidden="true" className="h-16 w-16 shrink-0 bg-peach-light" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-black">{item.name}</p>
                            <p className="mt-1 text-xs text-black/60">
                              {item.weight} · {item.quantity} × UGX {Number(item.unit_price).toLocaleString()}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-black">
                            UGX {Number(item.line_total).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                    {selectedNotification.details.status === 'fulfilled'
                      && selectedNotification.details.review_products?.length > 0 && (
                        <div className="mt-5 border border-peach-mid/50 bg-[#fffdfa] p-4">
                          <h3 className="font-bold text-black">Rate your coffee</h3>
                          <p className="mt-1 text-sm text-black/65">
                            Your order is fulfilled. Share a rating and review for the coffee you received.
                          </p>
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {selectedNotification.details.review_products.map(item => (
                              <li key={item.slug}>
                                <Link
                                  to={`/review/${encodeURIComponent(item.slug)}`}
                                  className="inline-flex min-h-10 items-center border border-[#593a27] px-3 py-2 text-sm font-semibold text-[#593a27] transition hover:bg-[#593a27] hover:text-white"
                                >
                                  Review {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    <div className="mt-4 flex justify-between gap-4 text-base font-bold text-black">
                      <span>Order total</span>
                      <span>UGX {Number(selectedNotification.details.total).toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-6 whitespace-pre-line text-sm leading-7 text-black/75">{selectedNotification.message}</p>
                )}
              </article>
            ) : (
              <div className="flex h-full min-h-52 items-center justify-center text-center text-sm text-black/55">
                {isLoading ? 'Choose a notification to view it.' : 'Select a notification to read its details.'}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
