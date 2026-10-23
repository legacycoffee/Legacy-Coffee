import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'

const tabs = ['Overview', 'Orders', 'Requests']

function formatDate(value) {
  return new Intl.DateTimeFormat('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Kampala',
  }).format(new Date(value))
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(value)
}

function StatusBadge({ children }) {
  return (
    <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold capitalize text-orange-800">
      {children.replaceAll('_', ' ')}
    </span>
  )
}

function EmptyState({ children }) {
  return <p className="py-8 text-center text-sm text-stone-500">{children}</p>
}

export default function AdminDashboard() {
  const { token, isAuthenticated, user, signIn, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('Overview')
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [dataError, setDataError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [inquiries, setInquiries] = useState([])

  useEffect(() => {
    if (!token) return undefined

    let isCurrent = true
    Promise.all([
      apiRequest('/dashboard/', { token }),
      apiRequest('/dashboard/orders/', { token }),
      apiRequest('/dashboard/inquiries/', { token }),
    ])
      .then(([nextSummary, orderPage, inquiryPage]) => {
        if (!isCurrent) return
        setSummary(nextSummary)
        setOrders(orderPage.results)
        setInquiries(inquiryPage.results)
        setDataError('')
      })
      .catch(error => {
        if (isCurrent) setDataError(error.message)
      })

    return () => {
      isCurrent = false
    }
  }, [token])

  const handleLogin = async event => {
    event.preventDefault()
    setLoginError('')
    setDataError('')
    setIsSigningIn(true)
    try {
      await signIn(credentials)
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setIsSigningIn(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff8f1] px-4 py-10">
        <div className="w-full max-w-md border border-orange-100 bg-white p-6 shadow-sm sm:p-9">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F58537] text-lg font-bold text-white">LC</div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F58537]">Staff portal</p>
            <h1 className="mt-2 text-2xl font-bold text-stone-900">Admin sign in</h1>
            <p className="mt-2 text-sm text-stone-600">Sign in with your authorized staff account to view orders and requests.</p>
          </div>
          {loginError && <p role="alert" className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{loginError}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-sm font-medium text-stone-800" htmlFor="admin-email">
              Email address
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={credentials.email}
                onChange={event => setCredentials(current => ({ ...current, email: event.target.value }))}
                className="mt-1.5 w-full border border-stone-300 px-3.5 py-3 outline-none focus:border-[#F58537] focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <label className="block text-sm font-medium text-stone-800" htmlFor="admin-password">
              Password
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={event => setCredentials(current => ({ ...current, password: event.target.value }))}
                className="mt-1.5 w-full border border-stone-300 px-3.5 py-3 outline-none focus:border-[#F58537] focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <button disabled={isSigningIn} className="w-full bg-[#F58537] px-4 py-3 font-bold text-white hover:bg-[#e8742b] disabled:cursor-wait disabled:opacity-60">
              {isSigningIn ? 'Signing in…' : 'Sign in to dashboard'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  const stats = summary ? [
    { label: 'All orders', value: summary.orders },
    { label: 'Pending orders', value: summary.pending_orders },
    { label: 'All requests', value: summary.inquiries },
    { label: 'New requests', value: summary.new_inquiries },
    { label: 'Product shares', value: summary.product_shares },
  ] : []
  const isLoading = !summary && !dataError

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-stone-900 px-4 py-4 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F58537] text-sm font-bold">LC</div>
          <div>
            <p className="font-semibold">Legacy Coffee — Staff</p>
            <p className="text-xs text-white/65">{user?.email}</p>
          </div>
        </div>
        <button onClick={signOut} className="text-sm font-medium text-white/75 hover:text-white">Sign out</button>
      </header>

      <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto border-b bg-white px-4 sm:px-6">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-current={activeTab === tab ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-[#F58537] text-[#b94d0b]' : 'border-transparent text-stone-500 hover:text-stone-900'}`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
        {dataError && (
          <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>{dataError.includes('permission') ? 'This account does not have staff access.' : dataError}</p>
            <button onClick={signOut} className="font-semibold underline">Sign out</button>
          </div>
        )}
        {isLoading && <p role="status" className="mb-5 text-sm text-stone-500">Loading dashboard data…</p>}

        {activeTab === 'Overview' && (
          <section aria-labelledby="overview-heading">
            <h1 id="overview-heading" className="mb-6 text-2xl font-bold text-stone-900">Dashboard overview</h1>
            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {stats.map(stat => (
                <div key={stat.label} className="border border-stone-100 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-2xl font-bold text-[#b94d0b]">{stat.value}</p>
                  <p className="mt-1 text-xs text-stone-600">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="border border-stone-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-bold text-stone-900">Recent orders</h2>
                  <button onClick={() => setActiveTab('Orders')} className="text-sm font-semibold text-[#b94d0b]">View all</button>
                </div>
                {orders.length === 0 ? <EmptyState>No orders received yet.</EmptyState> : (
                  <ul className="divide-y divide-stone-100">
                    {orders.slice(0, 5).map(order => (
                      <li key={order.reference} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                        <div><p className="font-semibold text-stone-900">{order.customer_name}</p><p className="text-xs text-stone-500">{order.reference} · {formatDate(order.created_at)}</p></div>
                        <div className="text-right"><p className="font-semibold text-stone-800">{formatPrice(order.total)}</p><StatusBadge>{order.status}</StatusBadge></div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="border border-stone-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-bold text-stone-900">Recent requests</h2>
                  <button onClick={() => setActiveTab('Requests')} className="text-sm font-semibold text-[#b94d0b]">View all</button>
                </div>
                {inquiries.length === 0 ? <EmptyState>No requests received yet.</EmptyState> : (
                  <ul className="divide-y divide-stone-100">
                    {inquiries.slice(0, 5).map(inquiry => (
                      <li key={inquiry.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                        <div><p className="font-semibold text-stone-900">{inquiry.subject || inquiry.kind} · {inquiry.name}</p><p className="text-xs text-stone-500">{inquiry.email} · {formatDate(inquiry.created_at)}</p></div>
                        <StatusBadge>{inquiry.status}</StatusBadge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </section>
        )}

        {activeTab === 'Orders' && (
          <section aria-labelledby="orders-heading" className="border border-stone-100 bg-white p-4 shadow-sm sm:p-6">
            <h1 id="orders-heading" className="mb-5 text-2xl font-bold text-stone-900">Order inbox</h1>
            {orders.length === 0 ? <EmptyState>No orders received yet.</EmptyState> : (
              <div className="space-y-4">
                {orders.map(order => (
                  <article key={order.reference} className="border border-stone-200 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-3">
                      <div>
                        <h2 className="font-bold text-stone-900">{order.customer_name}</h2>
                        <p className="mt-1 text-xs text-stone-500">{order.reference} · {formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3"><StatusBadge>{order.status}</StatusBadge><strong className="text-stone-900">{formatPrice(order.total)}</strong></div>
                    </div>
                    <div className="grid gap-4 py-4 text-sm sm:grid-cols-2">
                      <div><p className="font-semibold text-stone-700">Customer</p><a className="mt-1 block text-[#a5440b] underline" href={`mailto:${order.customer_email}`}>{order.customer_email}</a><a className="text-[#a5440b] underline" href={`tel:${order.customer_phone}`}>{order.customer_phone}</a></div>
                      <div><p className="font-semibold text-stone-700">Delivery address</p><p className="mt-1 text-stone-600">{order.delivery_address}, {order.delivery_city}</p>{order.delivery_notes && <p className="mt-1 text-stone-500">Note: {order.delivery_notes}</p>}</div>
                    </div>
                    <ul className="space-y-2 border-t border-stone-100 pt-3 text-sm">
                      {order.items.map((item, index) => (
                        <li key={`${item.product_name}-${index}`} className="flex justify-between gap-3 text-stone-700">
                          <span>{item.product_name} ({item.weight}) × {item.quantity}</span>
                          <span>{formatPrice(item.line_total)}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'Requests' && (
          <section aria-labelledby="requests-heading" className="border border-stone-100 bg-white p-4 shadow-sm sm:p-6">
            <h1 id="requests-heading" className="mb-5 text-2xl font-bold text-stone-900">Contact and business requests</h1>
            {inquiries.length === 0 ? <EmptyState>No requests received yet.</EmptyState> : (
              <div className="space-y-4">
                {inquiries.map(inquiry => (
                  <article key={inquiry.id} className="border border-stone-200 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold capitalize text-stone-900">{inquiry.subject || `${inquiry.kind} request`}</h2><StatusBadge>{inquiry.kind}</StatusBadge></div>
                        <p className="mt-1 text-xs text-stone-500">{formatDate(inquiry.created_at)} · Status: {inquiry.status.replaceAll('_', ' ')}</p>
                      </div>
                      <StatusBadge>{inquiry.status}</StatusBadge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="font-medium text-stone-800">{inquiry.name}</span>
                      <a className="text-[#a5440b] underline" href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                      {inquiry.phone && <a className="text-[#a5440b] underline" href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>}
                    </div>
                    {(inquiry.business_name || inquiry.product || inquiry.quantity) && (
                      <p className="mt-2 text-sm text-stone-600">
                        {[inquiry.business_name, inquiry.product, inquiry.quantity].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{inquiry.message}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
