import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'

function formatNotificationDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function NotificationsPage() {
  const { isAuthenticated, token } = useAuth()
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
          : data.results[0]?.id ?? null
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

  const selectedNotification = notifications.find(item => item.id === selectedId)

  const openNotification = notification => {
    setSelectedId(notification.id)
  }

  useEffect(() => {
    if (!selectedNotification || selectedNotification.is_read) return
    setError('')
    let isCurrent = true
    apiRequest(`/auth/notifications/${selectedNotification.id}/read/`, {
      method: 'PATCH',
      token,
    }).then(() => {
      if (!isCurrent) return
      setNotifications(current => current.map(item => (
        item.id === selectedNotification.id ? { ...item, is_read: true } : item
      )))
      window.dispatchEvent(new Event('legacy-notifications-updated'))
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
        <p className="mt-2 text-sm text-black/65">Order updates and account messages.</p>

        {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        <div className="mt-7 grid min-h-[28rem] gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.6fr)]">
          <section aria-label="Notification list" className="border border-peach-mid/50 bg-white shadow-sm">
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

          <section aria-label="Selected notification" className="border border-peach-mid/50 bg-white p-5 shadow-sm sm:p-7">
            {selectedNotification ? (
              <article>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  {selectedNotification.is_read ? 'Notification' : 'New notification'}
                </p>
                <h2 className="mt-2 text-xl font-bold text-black sm:text-2xl">{selectedNotification.title}</h2>
                <time dateTime={selectedNotification.created_at} className="mt-2 block text-sm text-black/55">
                  {formatNotificationDate(selectedNotification.created_at)}
                </time>
                {selectedNotification.details?.reference ? (
                  <div className="mt-6 border-t border-peach-mid/40 pt-5">
                    <p className="text-xs font-semibold text-black/55">Order number</p>
                    <p className="mt-1 font-bold text-black">{selectedNotification.details.reference}</p>
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
