import { useEffect, useMemo, useState } from 'react'
import {
  LuArrowUpRight,
  LuClipboardList,
  LuClock3,
  LuCoffee,
  LuLayoutDashboard,
  LuLogOut,
  LuMail,
  LuMapPin,
  LuMenu,
  LuMessageSquare,
  LuPackage,
  LuPhone,
  LuSearch,
  LuShare2,
  LuUsers,
  LuX,
} from 'react-icons/lu'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'

const sections = [
  { id: 'Overview', label: 'Overview', icon: LuLayoutDashboard },
  { id: 'Orders', label: 'Orders', icon: LuClipboardList },
  { id: 'Requests', label: 'Requests', icon: LuMessageSquare },
]

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
  }).format(Number(value) || 0)
}

function StatusBadge({ children }) {
  const status = children.toLowerCase()
  const color = status === 'pending' || status === 'new'
    ? 'bg-amber-50 text-amber-800 ring-amber-200'
    : status === 'confirmed' || status === 'in progress'
      ? 'bg-blue-50 text-blue-800 ring-blue-200'
      : status === 'fulfilled' || status === 'resolved'
        ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
        : status === 'cancelled'
          ? 'bg-rose-50 text-rose-800 ring-rose-200'
          : 'bg-stone-100 text-stone-700 ring-stone-200'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${color}`}>
      {status === 'pending' || status === 'new' ? <LuClock3 aria-hidden="true" className="h-3 w-3" /> : null}
      {status.replaceAll('_', ' ')}
    </span>
  )
}

function EmptyState({ icon: Icon = LuCoffee, title, description }) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f7efe7] text-[#9b542b]">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-stone-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">{description}</p>}
    </div>
  )
}

function SectionHeading({ eyebrow, title, description, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a75a31]">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-stone-500">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SearchBox({ value, onChange, label }) {
  return (
    <label className="relative block w-full sm:max-w-xs">
      <span className="sr-only">{label}</span>
      <LuSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={label}
        className="w-full border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-800 outline-none transition focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100"
      />
    </label>
  )
}

export default function AdminDashboard() {
  const { token, isAuthenticated, user, signIn, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('Overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [dataError, setDataError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [orderSearch, setOrderSearch] = useState('')
  const [requestSearch, setRequestSearch] = useState('')

  useEffect(() => {
    if (!isSidebarOpen) return undefined

    const handleKeyDown = event => {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

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

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase()
    if (!query) return orders
    return orders.filter(order => [
      order.reference,
      order.customer_name,
      order.business_name,
      order.customer_email,
      order.customer_phone,
      ...order.items.map(item => item.product_name),
    ].some(value => value?.toLowerCase().includes(query)))
  }, [orders, orderSearch])

  const filteredInquiries = useMemo(() => {
    const query = requestSearch.trim().toLowerCase()
    if (!query) return inquiries
    return inquiries.filter(inquiry => [
      inquiry.subject,
      inquiry.kind,
      inquiry.name,
      inquiry.business_name,
      inquiry.email,
      inquiry.product,
      inquiry.message,
    ].some(value => value?.toLowerCase().includes(query)))
  }, [inquiries, requestSearch])

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f2ee] px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(49,34,23,0.12)] md:min-h-[590px] md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative hidden flex-col justify-between overflow-hidden bg-[#2b211b] p-10 text-white md:flex lg:p-14">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -right-6 -top-6 h-44 w-44 rounded-full border border-white/10" />
            <div className="relative flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f58537] font-bold">LC</span>
              <div>
                <p className="font-semibold">Legacy Coffee</p>
                <p className="text-xs text-white/55">Administration</p>
              </div>
            </div>
            <div className="relative max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f3a66f]">Staff workspace</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">Good coffee.<br />Well managed.</h1>
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">
                Review orders, respond to business requests, and keep the Legacy Coffee operation moving.
              </p>
            </div>
            <p className="relative text-xs text-white/40">Authorized team members only</p>
          </div>

          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-14">
            <div className="mb-8 md:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f58537] font-bold text-white">LC</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a75a31]">Staff portal</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">Sign in with your authorized staff account to access your workspace.</p>
            {loginError && <p role="alert" className="mt-6 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{loginError}</p>}
            <form onSubmit={handleLogin} className="mt-7 space-y-5">
              <label className="block text-sm font-medium text-stone-700" htmlFor="admin-email">
                Email address
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={credentials.email}
                  onChange={event => setCredentials(current => ({ ...current, email: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#bf7043] focus:ring-4 focus:ring-orange-100"
                  placeholder="you@legacycoffee.com"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700" htmlFor="admin-password">
                Password
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={credentials.password}
                  onChange={event => setCredentials(current => ({ ...current, password: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#bf7043] focus:ring-4 focus:ring-orange-100"
                  placeholder="Enter your password"
                />
              </label>
              <button
                disabled={isSigningIn}
                className="mt-2 w-full rounded-lg bg-[#593a27] px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#40291d] disabled:cursor-wait disabled:opacity-60"
              >
                {isSigningIn ? 'Signing in…' : 'Sign in to workspace'}
              </button>
            </form>
            <p className="mt-7 text-center text-xs text-stone-400">Access is limited to authorized staff accounts.</p>
          </div>
        </div>
      </main>
    )
  }

  const isLoading = !summary && !dataError
  const activeSection = sections.find(section => section.id === activeTab) || sections[0]
  const HeaderIcon = activeSection.icon
  const stats = summary ? [
    { label: 'Total orders', value: summary.orders, note: `${summary.pending_orders} awaiting review`, icon: LuClipboardList, accent: 'bg-orange-50 text-orange-700' },
    { label: 'Pending orders', value: summary.pending_orders, note: 'Need your attention', icon: LuClock3, accent: 'bg-amber-50 text-amber-700' },
    { label: 'All requests', value: summary.inquiries, note: `${summary.new_inquiries} new requests`, icon: LuMessageSquare, accent: 'bg-blue-50 text-blue-700' },
    { label: 'New requests', value: summary.new_inquiries, note: 'Contact and business enquiries', icon: LuMail, accent: 'bg-violet-50 text-violet-700' },
    { label: 'Active products', value: summary.active_products, note: `${summary.products} in catalog`, icon: LuCoffee, accent: 'bg-emerald-50 text-emerald-700' },
    { label: 'Subscribers', value: summary.active_subscribers, note: 'Active newsletter subscribers', icon: LuUsers, accent: 'bg-sky-50 text-sky-700' },
    { label: 'Product shares', value: summary.product_shares, note: 'Customer shares recorded', icon: LuShare2, accent: 'bg-rose-50 text-rose-700' },
  ] : []

  const changeSection = section => setActiveTab(section)

  return (
    <main className="min-h-screen bg-[#f6f7f8] text-stone-900 lg:flex">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#241d18] text-white transition-transform duration-200 ease-out lg:z-20 lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-5 lg:py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f58537] text-sm font-bold">LC</span>
            <div>
              <p className="text-sm font-semibold">Legacy Coffee</p>
              <p className="mt-0.5 text-[11px] text-white/50">ADMIN WORKSPACE</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <LuX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 sm:px-6 lg:px-5 lg:pt-8">
          Workspace
        </div>
        <nav aria-label="Admin sections" className="flex flex-col gap-1 overflow-y-auto px-3 pb-3">
          {sections.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            const count = id === 'Orders'
              ? summary?.pending_orders
              : id === 'Requests'
                ? summary?.new_inquiries
                : null
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  changeSection(id)
                  setIsSidebarOpen(false)
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors lg:w-full ${
                  isActive ? 'bg-white/10 font-semibold text-white shadow-inner' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon aria-hidden="true" className={`h-[18px] w-[18px] ${isActive ? 'text-[#f6a66f]' : ''}`} />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-[#f58537] text-white' : 'bg-white/10 text-white/65'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#49372a] text-xs font-semibold text-[#f6c39f]">
              {(user?.email?.[0] || 'A').toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user?.email}</p>
              <p className="mt-0.5 text-[10px] text-white/40">Staff account</p>
            </div>
            <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="rounded-md p-2 text-white/50 transition hover:bg-white/10 hover:text-white">
              <LuLogOut aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-stone-200/80 bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-10">
          <div className="flex items-center gap-2.5 text-sm">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isSidebarOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-700 transition hover:bg-stone-50 lg:hidden"
            >
              {isSidebarOpen ? <LuX aria-hidden="true" className="h-5 w-5" /> : <LuMenu aria-hidden="true" className="h-5 w-5" />}
            </button>
            <span className="hidden h-8 w-8 items-center justify-center rounded-lg bg-[#f7efe7] text-[#9b542b] sm:flex">
              <HeaderIcon aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="hidden text-stone-400 sm:inline">Workspace</span>
            <span className="hidden text-stone-300 sm:inline">/</span>
            <span className="font-semibold text-stone-800">{activeTab}</span>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-right">
              <span className="block text-xs font-semibold text-stone-700">{user?.email}</span>
              <span className="block text-[10px] text-stone-400">Administrator</span>
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#593a27] text-xs font-semibold text-white">
              {(user?.email?.[0] || 'A').toUpperCase()}
            </span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
          {dataError && (
            <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p>{dataError.toLowerCase().includes('permission') ? 'This account does not have staff access.' : dataError}</p>
              <button type="button" onClick={signOut} className="font-semibold underline">Sign out</button>
            </div>
          )}
          {isLoading && <p role="status" className="mb-5 rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-500">Loading workspace data…</p>}

          {activeTab === 'Overview' && (
            <section aria-labelledby="overview-heading">
              <SectionHeading
                eyebrow="At a glance"
                title="Dashboard overview"
                description="A clear view of today’s activity across your coffee business."
              />

              <dl className="mb-8 grid grid-cols-2 border-y border-stone-200 sm:grid-cols-4 xl:grid-cols-7">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`flex items-center gap-3 py-4 pr-3 ${index % 2 === 1 ? 'border-l border-stone-200 pl-3 sm:border-l-0 sm:pl-0' : ''} ${
                      index > 1 ? 'border-t border-stone-200 sm:border-t-0' : ''
                    } ${index > 0 && index % 2 === 0 ? 'sm:border-l sm:border-stone-200 sm:pl-4' : ''}`}
                  >
                    <stat.icon aria-hidden="true" className="hidden h-4 w-4 shrink-0 text-[#9b542b] sm:block" />
                    <div className="min-w-0">
                      <dd className="text-lg font-bold leading-tight text-stone-900">{stat.value ?? '—'}</dd>
                      <dt className="mt-1 text-[11px] leading-snug text-stone-500">{stat.label}</dt>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
                  <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                    <div>
                      <h2 className="text-sm font-semibold text-stone-900">Recent orders</h2>
                      <p className="mt-0.5 text-xs text-stone-400">Latest activity from your customers</p>
                    </div>
                    <button type="button" onClick={() => changeSection('Orders')} className="inline-flex items-center gap-1 text-xs font-semibold text-[#a75a31] hover:text-[#784126]">
                      View orders <LuArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <EmptyState icon={LuPackage} title="No orders yet" description="New customer orders will appear here." />
                  ) : (
                    <ul className="divide-y divide-stone-100 px-5">
                      {orders.slice(0, 5).map(order => (
                        <li key={order.reference} className="flex flex-wrap items-center justify-between gap-3 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
                              <LuPackage aria-hidden="true" className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-stone-800">{order.customer_name}</p>
                              <p className="mt-0.5 truncate text-xs text-stone-400">{order.reference} · {formatDate(order.created_at)}</p>
                            </div>
                          </div>
                          <div className="ml-auto flex items-center gap-3">
                            <span className="text-right text-sm font-semibold text-stone-800">{formatPrice(order.total)}</span>
                            <StatusBadge>{order.status}</StatusBadge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
                  <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                    <div>
                      <h2 className="text-sm font-semibold text-stone-900">Recent requests</h2>
                      <p className="mt-0.5 text-xs text-stone-400">Messages from customers and businesses</p>
                    </div>
                    <button type="button" onClick={() => changeSection('Requests')} className="inline-flex items-center gap-1 text-xs font-semibold text-[#a75a31] hover:text-[#784126]">
                      View requests <LuArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {inquiries.length === 0 ? (
                    <EmptyState icon={LuMessageSquare} title="No requests yet" description="Contact and business enquiries will show here." />
                  ) : (
                    <ul className="divide-y divide-stone-100 px-5">
                      {inquiries.slice(0, 5).map(inquiry => (
                        <li key={inquiry.id} className="flex items-start justify-between gap-3 py-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-stone-800">{inquiry.subject || `${inquiry.kind} request`}</p>
                            <p className="mt-1 truncate text-xs text-stone-500">{inquiry.name} · {inquiry.email}</p>
                            <p className="mt-1 text-[11px] text-stone-400">{formatDate(inquiry.created_at)}</p>
                          </div>
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
            <section aria-labelledby="orders-heading">
              <SectionHeading
                eyebrow="Commerce"
                title="Order management"
                description={`${summary?.orders ?? orders.length} orders · ${summary?.pending_orders ?? 0} pending`}
              >
                <SearchBox value={orderSearch} onChange={setOrderSearch} label="Search orders" />
              </SectionHeading>
              {filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-stone-200/80 bg-white">
                  <EmptyState
                    icon={LuPackage}
                    title={orderSearch ? 'No matching orders' : 'No orders to show'}
                    description={orderSearch ? 'Try another customer, order number, or product.' : 'Customer orders will appear here when they are placed.'}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <article key={order.reference} className="overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
                      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 px-5 py-4 sm:px-6">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
                            <LuPackage aria-hidden="true" className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <h2 className="truncate text-sm font-semibold text-stone-900">{order.customer_name}</h2>
                            {order.business_name && <p className="mt-0.5 text-xs text-stone-500">{order.business_name}</p>}
                            <p className="mt-1 text-xs text-stone-400">{order.reference} · {formatDate(order.created_at)}</p>
                          </div>
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                          <StatusBadge>{order.status}</StatusBadge>
                          <span className="text-right">
                            <span className="block text-[10px] uppercase tracking-wide text-stone-400">Order total</span>
                            <strong className="mt-0.5 block text-sm text-stone-900">{formatPrice(order.total)}</strong>
                          </span>
                        </div>
                      </header>
                      <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-6">
                        <div>
                          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Customer contact</h3>
                          <a className="mt-2 flex items-center gap-2 text-sm text-[#8b4a2b] hover:underline" href={`mailto:${order.customer_email}`}>
                            <LuMail aria-hidden="true" className="h-4 w-4 shrink-0" />{order.customer_email}
                          </a>
                          <a className="mt-1.5 flex items-center gap-2 text-sm text-[#8b4a2b] hover:underline" href={`tel:${order.customer_phone}`}>
                            <LuPhone aria-hidden="true" className="h-4 w-4 shrink-0" />{order.customer_phone}
                          </a>
                        </div>
                        <div>
                          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Delivery details</h3>
                          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-stone-600">
                            <LuMapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-stone-400" />
                            <span>{order.delivery_address}, {order.delivery_city}{order.delivery_notes && <span className="block text-xs text-stone-400">Note: {order.delivery_notes}</span>}</span>
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-stone-100 bg-stone-50/60 px-5 py-4 sm:px-6">
                        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Items ordered</h3>
                        <ul className="space-y-2.5">
                          {order.items.map((item, index) => (
                            <li key={`${item.product_name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                              <span className="text-stone-700">{item.product_name} <span className="text-stone-400">({item.weight}) × {item.quantity}</span></span>
                              <span className="font-medium text-stone-800">{item.is_wholesale && <span className="mr-2 rounded bg-[#f2e7dc] px-1.5 py-0.5 text-[10px] font-semibold text-[#80543d]">Wholesale</span>}{formatPrice(item.line_total)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'Requests' && (
            <section aria-labelledby="requests-heading">
              <SectionHeading
                eyebrow="Customer communication"
                title="Requests inbox"
                description={`${summary?.inquiries ?? inquiries.length} requests · ${summary?.new_inquiries ?? 0} new`}
              >
                <SearchBox value={requestSearch} onChange={setRequestSearch} label="Search requests" />
              </SectionHeading>
              {filteredInquiries.length === 0 ? (
                <div className="rounded-xl border border-stone-200/80 bg-white">
                  <EmptyState
                    icon={LuMessageSquare}
                    title={requestSearch ? 'No matching requests' : 'No requests to show'}
                    description={requestSearch ? 'Try a different name, email, subject, or business.' : 'Customer messages and business enquiries will appear here.'}
                  />
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {filteredInquiries.map(inquiry => (
                    <article key={inquiry.id} className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.03)] sm:p-6">
                      <header className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-semibold text-stone-900">{inquiry.subject || `${inquiry.kind} request`}</h2>
                            <StatusBadge>{inquiry.kind}</StatusBadge>
                          </div>
                          <p className="mt-1.5 text-xs text-stone-400">{formatDate(inquiry.created_at)}</p>
                        </div>
                        <StatusBadge>{inquiry.status}</StatusBadge>
                      </header>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-y border-stone-100 py-3 text-xs">
                        <span className="font-semibold text-stone-700">{inquiry.name}</span>
                        <a className="text-[#8b4a2b] hover:underline" href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                        {inquiry.phone && <a className="text-[#8b4a2b] hover:underline" href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>}
                      </div>
                      {(inquiry.business_name || inquiry.product || inquiry.quantity) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[inquiry.business_name, inquiry.product, inquiry.quantity].filter(Boolean).map(value => (
                            <span key={value} className="rounded-md bg-stone-100 px-2.5 py-1 text-xs text-stone-600">{value}</span>
                          ))}
                        </div>
                      )}
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-600">{inquiry.message}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          <footer className="mt-10 border-t border-stone-200 pt-4 text-xs text-stone-400">
            Legacy Coffee · Staff workspace
          </footer>
        </div>
      </div>
    </main>
  )
}
