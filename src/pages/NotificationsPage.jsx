import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { LuTrash2 } from 'react-icons/lu'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'
import OrderInvoiceActions from '../components/OrderInvoiceActions.jsx'
import { createReadableSlug } from '../utils/createReadableSlug.js'
import { getOrderUrl } from '../utils/orderUrl.js'

function formatNotificationDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function NotificationsPage() {
  const { isAuthenticated, token } = useAuth()
  const navigate = useNavigate()
  const { notificationKey, notificationSlug } = useParams()
  const [notifications, setNotifications] = useState([])
  const [selectedPublicId, setSelectedPublicId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedNotificationIds, setSelectedNotificationIds] = useState([])
  const [pendingNotificationDeletion, setPendingNotificationDeletion] = useState(null)
  const [isDeletingNotifications, setIsDeletingNotifications] = useState(false)

  const loadNotifications = useCallback(async () => {
    setError('')
    try {
      const data = await apiRequest('/auth/notifications/', { token })
      setNotifications(data.results)
      setSelectedPublicId(currentId => (
        data.results.some(notification => notification.public_id === currentId)
          ? currentId
          : window.matchMedia('(min-width: 1024px)').matches
            ? data.results[0]?.public_id ?? null
            : null
      ))
      const availableIds = new Set(data.results.map(notification => notification.public_id))
      setSelectedNotificationIds(currentIds => currentIds.filter(id => availableIds.has(id)))
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
    if (!notificationKey) {
      if (!window.matchMedia('(min-width: 1024px)').matches) {
        setSelectedPublicId(null)
      }
      return
    }

    const notification = notifications.find(item => item.public_id === notificationKey)
    if (notification) {
      setSelectedPublicId(notification.public_id)
      const canonicalPath = `/notifications/${encodeURIComponent(notification.public_id)}/${createReadableSlug(notification.title)}`
      if (notificationSlug !== createReadableSlug(notification.title)) {
        navigate(canonicalPath, { replace: true })
      }
    } else if (!isLoading) {
      setSelectedPublicId(null)
      navigate('/notifications', { replace: true })
    }
  }, [isLoading, navigate, notificationKey, notificationSlug, notifications])

  const selectedNotification = notifications.find(item => item.public_id === selectedPublicId)

  const openNotification = notification => {
    setSelectedPublicId(notification.public_id)
    navigate(`/notifications/${encodeURIComponent(notification.public_id)}/${createReadableSlug(notification.title)}`)
  }

  const closeNotification = () => {
    setSelectedPublicId(null)
    navigate('/notifications')
  }

  const requestNotificationDeletion = (publicIds, all = false) => {
    setError('')
    setPendingNotificationDeletion({
      publicIds,
      all,
      count: all ? notifications.length : publicIds.length,
    })
  }

  const confirmNotificationDeletion = async () => {
    if (!pendingNotificationDeletion || isDeletingNotifications) return
    setError('')
    setIsDeletingNotifications(true)
    try {
      if (pendingNotificationDeletion.all) {
        await apiRequest('/auth/notifications/', {
          method: 'DELETE',
          body: { all: true },
          token,
        })
      } else if (pendingNotificationDeletion.publicIds.length === 1) {
        await apiRequest(`/auth/notifications/${encodeURIComponent(pendingNotificationDeletion.publicIds[0])}/`, {
          method: 'DELETE',
          token,
        })
      } else {
        await apiRequest('/auth/notifications/', {
          method: 'DELETE',
          body: { public_ids: pendingNotificationDeletion.publicIds },
          token,
        })
      }

      const deletedIds = new Set(
        pendingNotificationDeletion.all
          ? notifications.map(item => item.public_id)
          : pendingNotificationDeletion.publicIds,
      )
      setNotifications(current => current.filter(item => !deletedIds.has(item.public_id)))
      setSelectedNotificationIds(current => current.filter(id => !deletedIds.has(id)))
      if (selectedPublicId && deletedIds.has(selectedPublicId)) {
        setSelectedPublicId(null)
        navigate('/notifications', { replace: true })
      }
      setPendingNotificationDeletion(null)
      window.dispatchEvent(new CustomEvent('legacy-notifications-updated', {
        detail: { refresh: true },
      }))
    } catch (requestError) {
      setError(`Could not delete notifications: ${requestError.message}`)
    } finally {
      setIsDeletingNotifications(false)
    }
  }

  useEffect(() => {
    if (!selectedNotification || selectedNotification.is_read) return
    setError('')
    let isCurrent = true
    apiRequest(`/auth/notifications/${encodeURIComponent(selectedNotification.public_id)}/read/`, {
      method: 'PATCH',
      token,
    }).then(() => {
      if (!isCurrent) return
      setNotifications(current => current.map(item => (
        item.public_id === selectedNotification.public_id ? { ...item, is_read: true } : item
      )))
      window.dispatchEvent(new CustomEvent('legacy-notifications-updated', {
        detail: { refresh: true },
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
              notificationKey ? 'hidden lg:block' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-peach-mid/40 px-5 py-4">
              <h2 className="font-bold text-black">All notifications</h2>
              <button
                type="button"
                disabled={!notifications.length || isDeletingNotifications}
                onClick={() => requestNotificationDeletion([], true)}
                className="text-xs font-semibold text-red-700 underline decoration-red-300 underline-offset-2 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Clear all
              </button>
            </div>
            {isLoading ? (
              <p className="px-5 py-6 text-sm text-black/60">Loading notifications…</p>
            ) : notifications.length === 0 ? (
              <p className="px-5 py-6 text-sm text-black/60">You don’t have any notifications yet.</p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-peach-mid/30 px-4 py-2.5">
                  <label className="flex items-center gap-2 text-xs text-black/70">
                    <input
                      type="checkbox"
                      checked={notifications.length > 0 && notifications.every(item => selectedNotificationIds.includes(item.public_id))}
                      onChange={event => setSelectedNotificationIds(
                        event.target.checked
                          ? notifications.map(item => item.public_id)
                          : [],
                      )}
                      disabled={isDeletingNotifications || notifications.length > 500}
                      className="h-4 w-4 accent-red-700"
                    />
                    Select all{notifications.length > 500 ? ' (max 500 per batch)' : ''}
                  </label>
                  <button
                    type="button"
                    disabled={!selectedNotificationIds.length || isDeletingNotifications}
                    onClick={() => requestNotificationDeletion(selectedNotificationIds)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <LuTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    Delete selected{selectedNotificationIds.length ? ` (${selectedNotificationIds.length})` : ''}
                  </button>
                </div>
                <ul className="max-h-[34rem] divide-y divide-peach-mid/30 overflow-y-auto">
                {notifications.map(notification => (
                  <li key={notification.public_id} className="flex items-start">
                    <button
                      type="button"
                      aria-current={selectedPublicId === notification.public_id ? 'true' : undefined}
                      onClick={() => openNotification(notification)}
                      className={`flex min-w-0 flex-1 items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-peach-light/40 ${
                        selectedPublicId === notification.public_id ? 'bg-peach-light/50' : ''
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
                    <label className="mt-4 flex h-8 w-8 shrink-0 items-center justify-center">
                      <input
                        type="checkbox"
                        aria-label={`Select notification: ${notification.title}`}
                        checked={selectedNotificationIds.includes(notification.public_id)}
                        onChange={event => setSelectedNotificationIds(current => (
                          event.target.checked
                            ? [...new Set([...current, notification.public_id])]
                            : current.filter(id => id !== notification.public_id)
                        ))}
                        disabled={isDeletingNotifications
                          || (selectedNotificationIds.length >= 500 && !selectedNotificationIds.includes(notification.public_id))}
                        className="h-4 w-4 accent-red-700"
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Delete notification: ${notification.title}`}
                      title="Delete notification"
                      disabled={isDeletingNotifications}
                      onClick={() => requestNotificationDeletion([notification.public_id])}
                      className="m-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-black/55 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-50"
                    >
                      <LuTrash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </li>
                ))}
                </ul>
              </>
            )}
          </section>

          <section
            aria-label="Selected notification"
            className={`border border-peach-mid/50 bg-white p-5 shadow-sm sm:p-7 ${
              notificationKey ? '' : 'hidden lg:block'
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
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                      {selectedNotification.is_read ? 'Notification' : 'New notification'}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-black sm:text-2xl">{selectedNotification.title}</h2>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete notification: ${selectedNotification.title}`}
                    disabled={isDeletingNotifications}
                    onClick={() => requestNotificationDeletion([selectedNotification.public_id])}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-50"
                  >
                    <LuTrash2 aria-hidden="true" className="h-4 w-4" />
                    Delete
                  </button>
                </div>
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
                    {selectedNotification.details.public_id && (
                      <Link
                        to={getOrderUrl({
                          public_id: selectedNotification.details.public_id,
                          items: selectedNotification.details.items,
                        })}
                        className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
                      >
                        View this order
                      </Link>
                    )}
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
      {pendingNotificationDeletion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !isDeletingNotifications) {
              setPendingNotificationDeletion(null)
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="notification-delete-title"
            aria-describedby="notification-delete-warning"
            className="w-full max-w-lg border border-red-200 bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
                <LuTrash2 aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 id="notification-delete-title" className="text-lg font-bold text-stone-950">
                  {pendingNotificationDeletion.all ? 'Clear all notifications?' : `Delete ${pendingNotificationDeletion.count} selected notification${pendingNotificationDeletion.count === 1 ? '' : 's'}?`}
                </h2>
                <p id="notification-delete-warning" className="mt-2 text-sm leading-6 text-stone-700">
                  This permanently removes {pendingNotificationDeletion.all ? 'all your notifications' : 'the selected notification(s)'} from your account. This cannot be undone.
                </p>
              </div>
            </div>
            {error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
            <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setPendingNotificationDeletion(null)}
                disabled={isDeletingNotifications}
                className="min-h-10 rounded border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmNotificationDeletion}
                disabled={isDeletingNotifications}
                className="min-h-10 rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-50"
              >
                {isDeletingNotifications ? 'Deleting…' : 'Permanently delete'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
