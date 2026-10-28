import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LuStore } from 'react-icons/lu'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'

const sections = [
  { id: 'Overview', label: 'Overview' },
  { id: 'Orders', label: 'Order page' },
  { id: 'Products', label: 'Products' },
  { id: 'Requests', label: 'Requests' },
  { id: 'Users', label: 'Users' },
  { id: 'Subscribers', label: 'Subscribers' },
  { id: 'Settings', label: 'Settings' },
]

const emptyProduct = {
  slug: '',
  name: '',
  coffee_type: 'arabica',
  weight: '',
  price: '',
  wholesale_price: '',
  description: '',
  details: '',
  tasting_notes: '',
  roast: '',
  image: '',
  image_alt: '',
  is_active: true,
}

const orderStatusActions = {
  pending: [
    { status: 'confirmed', label: 'Confirm order' },
    { status: 'cancelled', label: 'Cancel order', destructive: true },
  ],
  confirmed: [
    { status: 'fulfilled', label: 'Mark fulfilled' },
    { status: 'cancelled', label: 'Cancel order', destructive: true },
    { status: 'pending', label: 'Reopen order' },
  ],
  fulfilled: [],
  cancelled: [{ status: 'pending', label: 'Reopen order' }],
}

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
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${color}`}>
      {status.replaceAll('_', ' ')}
    </span>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center sm:px-5 sm:py-12">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">{description}</p>}
    </div>
  )
}

function SavingButton({ isSaving, savingLabel, children, className, ...props }) {
  return (
    <button disabled={isSaving} className={`${className} disabled:cursor-wait disabled:opacity-60`} {...props}>
      {isSaving && (
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent align-[-2px]"
        />
      )}
      {isSaving ? savingLabel : children}
    </button>
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
    <label className="block w-full min-w-0 sm:max-w-xs">
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={label}
        className="w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100"
      />
    </label>
  )
}

export default function AdminDashboard() {
  const { token, isAuthenticated, user, signIn, signOut, clearAuth, updateUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSection = searchParams.get('tab')
  const activeTab = sections.some(section => section.id === requestedSection) ? requestedSection : 'Overview'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [dataError, setDataError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [usersPage, setUsersPage] = useState(null)
  const [orderSearch, setOrderSearch] = useState('')
  const [requestSearch, setRequestSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userPageNumber, setUserPageNumber] = useState(1)
  const [usersPageKey, setUsersPageKey] = useState('')
  const [usersError, setUsersError] = useState('')
  const [subscribersPage, setSubscribersPage] = useState(null)
  const [subscriberSearch, setSubscriberSearch] = useState('')
  const [subscriberPageNumber, setSubscriberPageNumber] = useState(1)
  const [subscribersPageKey, setSubscribersPageKey] = useState('')
  const [subscribersError, setSubscribersError] = useState('')
  const [orderStatusUpdates, setOrderStatusUpdates] = useState({})
  const [expandedOrders, setExpandedOrders] = useState({})
  const [productsPage, setProductsPage] = useState(null)
  const [productPageNumber, setProductPageNumber] = useState(1)
  const [productSearch, setProductSearch] = useState('')
  const [productError, setProductError] = useState('')
  const [productSuccess, setProductSuccess] = useState('')
  const [productsPageKey, setProductsPageKey] = useState('')
  const [isProductSaving, setIsProductSaving] = useState(false)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [productImageFile, setProductImageFile] = useState(null)
  const [productImagePreview, setProductImagePreview] = useState('')
  const [isProductEditorOpen, setIsProductEditorOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState('')
  const [accountForm, setAccountForm] = useState({ first_name: '', last_name: '' })
  const [isAccountEditing, setIsAccountEditing] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [isAccountSaving, setIsAccountSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [isPasswordEditing, setIsPasswordEditing] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const [admins, setAdmins] = useState([])
  const [adminsError, setAdminsError] = useState('')
  const [adminSuccess, setAdminSuccess] = useState('')
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '' })
  const [isNewAdminEditing, setIsNewAdminEditing] = useState(false)
  const [isAdminSaving, setIsAdminSaving] = useState(false)
  const [deletingAdminId, setDeletingAdminId] = useState(null)

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

  useEffect(() => {
    if (!token || activeTab !== 'Users') return undefined

    let isCurrent = true
    setUsersError('')
    const search = userSearch.trim()
    const query = new URLSearchParams({ page: String(userPageNumber) })
    if (search) query.set('search', search)
    const requestKey = `${userPageNumber}:${userSearch}`

    apiRequest(`/dashboard/users/?${query.toString()}`, { token })
      .then(data => {
        if (isCurrent) {
          setUsersPage(data)
          setUsersPageKey(requestKey)
        }
      })
      .catch(error => {
        if (isCurrent) setUsersError(error.message)
      })

    return () => {
      isCurrent = false
    }
  }, [activeTab, token, userSearch, userPageNumber])

  useEffect(() => {
    if (!token || activeTab !== 'Subscribers') return undefined

    let isCurrent = true
    const query = new URLSearchParams({ page: String(subscriberPageNumber) })
    if (subscriberSearch.trim()) query.set('search', subscriberSearch.trim())
    const requestKey = `${subscriberPageNumber}:${subscriberSearch}`

    apiRequest(`/dashboard/subscribers/?${query.toString()}`, { token })
      .then(data => {
        if (isCurrent) {
          setSubscribersPage(data)
          setSubscribersPageKey(requestKey)
          setSubscribersError('')
        }
      })
      .catch(error => {
        if (isCurrent) setSubscribersError(error.message)
      })

    return () => {
      isCurrent = false
    }
  }, [activeTab, token, subscriberSearch, subscriberPageNumber])

  useEffect(() => {
    if (!token || activeTab !== 'Products') return undefined
    let isCurrent = true
    const query = new URLSearchParams({ page: String(productPageNumber) })
    if (productSearch.trim()) query.set('search', productSearch.trim())
    const requestKey = `${productPageNumber}:${productSearch}`
    apiRequest(`/dashboard/products/?${query.toString()}`, { token })
      .then(data => {
        if (isCurrent) {
          setProductsPage(data)
          setProductsPageKey(requestKey)
          setProductError('')
        }
      })
      .catch(error => {
        if (isCurrent) setProductError(error.message)
      })
    return () => {
      isCurrent = false
    }
  }, [activeTab, token, productPageNumber, productSearch])

  useEffect(() => {
    if (!token || activeTab !== 'Settings') return undefined
    let isCurrent = true
    Promise.all([
      apiRequest('/auth/me/', { token }),
      apiRequest('/dashboard/admins/', { token }),
    ])
      .then(([data, adminPage]) => {
        if (!isCurrent) return
        setAccountForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
        })
        setAdmins(adminPage.results)
        setAdminsError('')
      })
      .catch(error => {
        if (isCurrent) setAdminsError(error.message)
      })
    return () => {
      isCurrent = false
    }
  }, [activeTab, token])

  useEffect(() => () => {
    if (productImagePreview.startsWith('blob:')) URL.revokeObjectURL(productImagePreview)
  }, [productImagePreview])

  const handleLogin = async event => {
    event.preventDefault()
    setLoginError('')
    setDataError('')
    setIsSigningIn(true)
    try {
      const signedInUser = await signIn(credentials)
      if (!signedInUser.is_staff) {
        clearAuth()
        setLoginError('This account does not have administrator access.')
      }
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setIsSigningIn(false)
    }
  }

  const updateOrderStatus = async (order, nextStatus) => {
    if (nextStatus === 'cancelled' && !window.confirm(`Cancel order ${order.reference}?`)) return

    setOrderStatusUpdates(current => ({
      ...current,
      [order.reference]: { isSaving: true, error: '', success: '' },
    }))
    try {
      const updatedOrder = await apiRequest(
        `/dashboard/orders/${encodeURIComponent(order.reference)}/status/`,
        { method: 'PATCH', body: { status: nextStatus }, token },
      )
      setOrders(current => current.map(item => (
        item.reference === updatedOrder.reference ? { ...item, ...updatedOrder } : item
      )))
      setSummary(current => {
        if (!current || order.status === updatedOrder.status) return current
        const pendingOrders = current.pending_orders
          + (updatedOrder.status === 'pending' ? 1 : 0)
          - (order.status === 'pending' ? 1 : 0)
        return { ...current, pending_orders: pendingOrders }
      })
      setOrderStatusUpdates(current => ({
        ...current,
        [order.reference]: { isSaving: false, error: '', success: 'Order status updated.' },
      }))
    } catch (error) {
      setOrderStatusUpdates(current => ({
        ...current,
        [order.reference]: { isSaving: false, error: error.message, success: '' },
      }))
    }
  }

  const startNewProduct = () => {
    setEditingProduct('')
    setProductForm(emptyProduct)
    setProductImageFile(null)
    setProductImagePreview('')
    setProductError('')
    setProductSuccess('')
    setIsProductEditorOpen(true)
  }

  const editProduct = product => {
    setEditingProduct(product.slug)
    setProductForm({
      ...product,
      price: String(product.price),
      wholesale_price: product.wholesale_price ?? '',
    })
    setProductImageFile(null)
    setProductImagePreview(product.image || '')
    setProductError('')
    setProductSuccess('')
    setIsProductEditorOpen(true)
  }

  const saveProduct = async event => {
    event.preventDefault()
    setProductError('')
    setProductSuccess('')
    setIsProductSaving(true)
    const payload = {
      ...productForm,
      slug: productForm.slug.trim(),
      name: productForm.name.trim(),
    }
    if (productImageFile) {
      payload.image = productImageFile
    } else if (payload.wholesale_price === '') {
      payload.wholesale_price = null
    }
    let requestBody = payload
    if (productImageFile) {
      requestBody = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        if (key !== 'image' && value !== null && value !== undefined) {
          requestBody.append(key, String(value))
        }
      })
      requestBody.append('image', productImageFile)
    }
    try {
      const previousProduct = editingProduct
        ? productsPage?.results.find(product => product.slug === editingProduct)
        : null
      const saved = await apiRequest(
        editingProduct
          ? `/dashboard/products/${encodeURIComponent(editingProduct)}/`
          : '/dashboard/products/',
        { method: editingProduct ? 'PATCH' : 'POST', body: requestBody, token },
      )
      setProductForm({ ...saved, wholesale_price: saved.wholesale_price ?? '' })
      setEditingProduct(saved.slug)
      setProductSuccess(`“${saved.name}” ${editingProduct ? 'updated' : 'created'} successfully.`)
      setSummary(current => current ? {
        ...current,
        products: current.products + (editingProduct ? 0 : 1),
        active_products: current.active_products
          + (saved.is_active ? 1 : 0)
          - (previousProduct?.is_active ? 1 : 0),
      } : current)
      const query = new URLSearchParams({ page: String(productPageNumber) })
      if (productSearch.trim()) query.set('search', productSearch.trim())
      const refreshedPage = await apiRequest(`/dashboard/products/?${query.toString()}`, { token })
      setProductsPage(refreshedPage)
      setProductImageFile(null)
      setProductImagePreview(saved.image)
      setIsProductEditorOpen(false)
    } catch (error) {
      setProductError(error.message)
    } finally {
      setIsProductSaving(false)
    }
  }

  const setProductPublished = async product => {
    setProductError('')
    try {
      const updated = await apiRequest(
        `/dashboard/products/${encodeURIComponent(product.slug)}/`,
        { method: 'PATCH', body: { is_active: !product.is_active }, token },
      )
      setProductsPage(current => current && ({
        ...current,
        results: current.results.map(item => item.slug === updated.slug ? updated : item),
      }))
      setSummary(current => current ? {
        ...current,
        active_products: current.active_products + (updated.is_active ? 1 : -1),
      } : current)
      setProductSuccess(`“${updated.name}” ${updated.is_active ? 'published' : 'unpublished'}.`)
    } catch (error) {
      setProductError(error.message)
    }
  }

  const deleteProduct = async product => {
    if (!window.confirm(`Permanently delete “${product.name}”? This cannot be undone.`)) return
    setProductError('')
    setProductSuccess('')
    try {
      await apiRequest(`/dashboard/products/${encodeURIComponent(product.slug)}/`, {
        method: 'DELETE',
        token,
      })
      setProductsPage(current => current && ({
        ...current,
        count: Math.max(0, current.count - 1),
        results: current.results.filter(item => item.slug !== product.slug),
      }))
      setSummary(current => current ? {
        ...current,
        products: Math.max(0, current.products - 1),
        active_products: Math.max(0, current.active_products - (product.is_active ? 1 : 0)),
      } : current)
      if (editingProduct === product.slug) startNewProduct()
      setProductSuccess(`“${product.name}” was deleted.`)
    } catch (error) {
      setProductError(error.message)
    }
  }

  const createAdmin = async event => {
    event.preventDefault()
    setAdminsError('')
    setAdminSuccess('')
    setIsAdminSaving(true)
    try {
      const created = await apiRequest('/dashboard/admins/', {
        method: 'POST',
        body: newAdmin,
        token,
      })
      setAdmins(current => [...current, created].sort((first, second) => first.email.localeCompare(second.email)))
      setNewAdmin({ username: '', email: '', password: '' })
      setAdminSuccess(`Administrator ${created.email} was added.`)
      setIsNewAdminEditing(false)
    } catch (error) {
      setAdminsError(error.message)
    } finally {
      setIsAdminSaving(false)
    }
  }

  const removeAdmin = async admin => {
    if (!window.confirm(`Delete administrator ${admin.email}? They will lose admin access immediately.`)) return
    setAdminsError('')
    setAdminSuccess('')
    setDeletingAdminId(admin.id)
    try {
      await apiRequest(`/dashboard/admins/${admin.id}/`, { method: 'DELETE', token })
      setAdmins(current => current.filter(item => item.id !== admin.id))
      setAdminSuccess(`Administrator ${admin.email} was deleted.`)
      if (admin.id === user?.id) await signOut()
    } catch (error) {
      setAdminsError(error.message)
    } finally {
      setDeletingAdminId(null)
    }
  }

  const saveAccount = async event => {
    event.preventDefault()
    setAccountError('')
    setAccountSuccess('')
    setIsAccountSaving(true)
    try {
      const updated = await apiRequest('/auth/me/', {
        method: 'PATCH',
        body: accountForm,
        token,
      })
      updateUser({ ...user, ...updated })
      setAccountSuccess('Your account details were saved.')
      setIsAccountEditing(false)
    } catch (error) {
      setAccountError(error.message)
    } finally {
      setIsAccountSaving(false)
    }
  }

  const changePassword = async event => {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setIsPasswordSaving(true)
    try {
      await apiRequest('/auth/change-password/', {
        method: 'POST',
        body: passwordForm,
        token,
      })
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      setPasswordSuccess('Password changed successfully.')
      setIsPasswordEditing(false)
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setIsPasswordSaving(false)
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

  const changeUserSearch = value => {
    setUserSearch(value)
    setUserPageNumber(1)
  }
  const isUsersLoading = activeTab === 'Users'
    && usersPageKey !== `${userPageNumber}:${userSearch}`
  const isSubscribersLoading = activeTab === 'Subscribers'
    && subscribersPageKey !== `${subscriberPageNumber}:${subscriberSearch}`
  const isProductLoading = activeTab === 'Products'
    && productsPageKey !== `${productPageNumber}:${productSearch}`
    && !productError

  if (!isAuthenticated || !user?.is_staff) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f2ee] px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(49,34,23,0.12)] md:min-h-[590px] md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative hidden flex-col justify-between overflow-hidden bg-[#2b211b] p-10 text-white md:flex lg:p-14">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -right-6 -top-6 h-44 w-44 rounded-full border border-white/10" />
            <div className="relative flex items-center gap-3">
            <img src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792498215/Legacy_logo.png" alt="Legacy Coffee" className="h-10 w-auto brightness-0 invert" />
              <div>
                <p className="font-semibold">Legacy Coffee</p>
              <p className="text-xs text-white/55">Admin Portal</p>
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
              <img src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792498215/Legacy_logo.png" alt="Legacy Coffee" className="h-10 w-auto" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a75a31]">Admin Portal</p>
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
  const stats = summary ? [
    { label: 'Total orders', value: summary.orders, note: `${summary.pending_orders} awaiting review` },
    { label: 'Pending orders', value: summary.pending_orders, note: 'Need your attention' },
    { label: 'All requests', value: summary.inquiries, note: `${summary.new_inquiries} new requests` },
    { label: 'New requests', value: summary.new_inquiries, note: 'Contact and business enquiries' },
    { label: 'Active products', value: summary.active_products, note: `${summary.products} in catalog` },
    { label: 'Subscribers', value: summary.active_subscribers, note: 'Active newsletter subscribers' },
    { label: 'Product shares', value: summary.product_shares, note: 'Customer shares recorded' },
  ] : []

  const changeSection = section => {
    setSearchParams(current => {
      const next = new URLSearchParams(current)
      if (section === 'Overview') {
        next.delete('tab')
      } else {
        next.set('tab', section)
      }
      return next
    })
    if (section === 'Products') setProductError('')
    if (section === 'Settings') setAccountError('')
  }

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
      <aside className={`fixed inset-y-0 right-0 z-30 flex w-64 flex-col bg-[#241d18] text-white transition-transform duration-200 ease-out lg:left-0 lg:right-auto lg:z-20 lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-5 lg:py-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792498215/Legacy_logo.png" alt="Legacy Coffee" className="h-9 w-auto brightness-0 invert" />
            <div>
              <p className="text-sm font-semibold">Legacy Coffee</p>
              <p className="mt-0.5 text-[11px] text-white/50">ADMIN PORTAL</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <span className="text-sm font-semibold">Close</span>
          </button>
        </div>

        <div className="px-4 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 sm:px-6 lg:px-5 lg:pt-8">
          Workspace
        </div>
        <nav aria-label="Admin sections" className="flex flex-col gap-1 overflow-y-auto px-3 pb-3">
          {sections.map(({ id, label }) => {
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
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors lg:w-full ${
                  isActive ? 'bg-white/10 font-semibold text-white shadow-inner' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
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
            <button type="button" onClick={signOut} className="rounded-md px-2 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 border-b border-stone-200/80 bg-white/95 px-3 backdrop-blur sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <img src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792498215/Legacy_logo.png" alt="Legacy Coffee" className="h-8 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-900">Legacy Coffee</p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a75a31]">Admin Portal · {activeTab}</p>
            </div>
          </div>
          <div className="ml-auto hidden items-center gap-3 sm:flex">
            <span className="text-right">
              <span className="block text-xs font-semibold text-stone-700">{user?.email}</span>
              <span className="block text-[10px] text-stone-400">Admin Portal</span>
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#593a27] text-xs font-semibold text-white">
              {(user?.email?.[0] || 'A').toUpperCase()}
            </span>
          </div>
          <Link
            to="/"
            aria-label="Switch to storefront"
            title="Storefront"
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#f58537] px-3 text-white shadow-sm transition hover:bg-[#d96b25] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a75a31]"
          >
            <LuStore aria-hidden="true" className="h-5 w-5" />
            <span className="text-xs font-semibold">Storefront</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(open => !open)}
            aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isSidebarOpen}
            className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-stone-200 text-stone-700 transition hover:bg-stone-50 lg:hidden"
          >
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-current" />
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-current" />
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-current" />
          </button>
        </header>

        <div className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-5 sm:px-7 sm:py-8 lg:px-10">
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
                    <button type="button" onClick={() => changeSection('Orders')} className="text-xs font-semibold text-[#a75a31] hover:text-[#784126]">
                      View orders
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <EmptyState title="No orders yet" description="New customer orders will appear here." />
                  ) : (
                    <ul className="divide-y divide-stone-100 px-5">
                      {orders.slice(0, 5).map(order => (
                        <li key={order.reference} className="flex flex-wrap items-center justify-between gap-3 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            {order.items[0]?.product_image ? (
                              <img
                                src={order.items[0].product_image}
                                alt={order.items[0].product_image_alt || order.items[0].product_name}
                                loading="lazy"
                                className="h-9 w-9 shrink-0 rounded-lg bg-white object-cover"
                              />
                            ) : (
                              <span className="h-9 w-9 shrink-0 rounded-lg bg-orange-50" aria-hidden="true" />
                            )}
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
                    <button type="button" onClick={() => changeSection('Requests')} className="text-xs font-semibold text-[#a75a31] hover:text-[#784126]">
                      View requests
                    </button>
                  </div>
                  {inquiries.length === 0 ? (
                    <EmptyState title="No requests yet" description="Contact and business enquiries will show here." />
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
                title="Order page"
                description={`${summary?.orders ?? orders.length} orders · ${summary?.pending_orders ?? 0} pending`}
              >
                <SearchBox value={orderSearch} onChange={setOrderSearch} label="Search orders" />
              </SectionHeading>
              {filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-stone-200/80 bg-white">
                  <EmptyState
                    title={orderSearch ? 'No matching orders' : 'No orders to show'}
                    description={orderSearch ? 'Try another customer, order number, or product.' : 'Customer orders will appear here when they are placed.'}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <article key={order.reference} className="overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
                      <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:px-5">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {order.items[0]?.product_image ? (
                            <img
                              src={order.items[0].product_image}
                              alt={order.items[0].product_image_alt || order.items[0].product_name}
                              loading="lazy"
                              className="h-10 w-10 shrink-0 rounded-lg bg-white object-cover"
                            />
                          ) : (
                            <span className="h-10 w-10 shrink-0 rounded-lg bg-orange-50" aria-hidden="true" />
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h2 className="truncate text-sm font-semibold text-stone-900">{order.customer_name}</h2>
                              {order.business_name && <span className="truncate text-xs text-stone-500">{order.business_name}</span>}
                            </div>
                            <p className="mt-1 truncate text-xs text-stone-400">
                              {order.reference} · {formatDate(order.created_at)} · {order.items.reduce((count, item) => count + item.quantity, 0)} items
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-start">
                          <span className="text-sm font-semibold text-stone-900">{formatPrice(order.total)}</span>
                          <StatusBadge>{order.status}</StatusBadge>
                        </div>
                        <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 sm:w-auto sm:flex-1 sm:justify-end sm:border-0 sm:pt-0">
                          <div aria-live="polite" className="min-w-0 text-xs">
                            {orderStatusUpdates[order.reference]?.error && (
                              <p role="alert" className="text-red-700">{orderStatusUpdates[order.reference].error}</p>
                            )}
                            {orderStatusUpdates[order.reference]?.success && (
                              <p role="status" className="text-emerald-700">{orderStatusUpdates[order.reference].success}</p>
                            )}
                          </div>
                          <div className="flex w-full flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">
                            {(orderStatusActions[order.status] || []).map(action => (
                              <button
                                key={action.status}
                                type="button"
                                disabled={orderStatusUpdates[order.reference]?.isSaving}
                                onClick={() => updateOrderStatus(order, action.status)}
                                className={`min-h-10 flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-50 sm:flex-none sm:px-3 ${
                                  action.destructive
                                    ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                                    : 'bg-[#593a27] text-white hover:bg-[#40291d]'
                                }`}
                              >
                                {orderStatusUpdates[order.reference]?.isSaving ? 'Updating…' : action.label}
                              </button>
                            ))}
                            {order.status === 'fulfilled' && (
                              <span className="self-center text-xs text-stone-400">Order complete</span>
                            )}
                          </div>
                          <button
                            type="button"
                            aria-label={`${expandedOrders[order.reference] ? 'Hide' : 'Show'} details for order ${order.reference}`}
                            aria-expanded={Boolean(expandedOrders[order.reference])}
                            aria-controls={`order-details-${order.reference}`}
                            onClick={() => setExpandedOrders(current => ({
                              ...current,
                              [order.reference]: !current[order.reference],
                            }))}
                            className="flex h-10 w-full shrink-0 items-center justify-center rounded-lg border border-stone-200 text-sm font-bold text-stone-600 transition hover:bg-stone-50 hover:text-stone-900 sm:h-9 sm:w-9"
                          >
                            <span aria-hidden="true" className={`transition-transform ${expandedOrders[order.reference] ? 'rotate-90' : ''}`}>›</span>
                          </button>
                        </div>
                      </div>
                      <div
                        id={`order-details-${order.reference}`}
                        hidden={!expandedOrders[order.reference]}
                        className="border-t border-stone-100"
                      >
                        <div className="grid gap-5 px-4 py-4 sm:grid-cols-2 sm:px-5">
                          <div>
                            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Customer contact</h3>
                            <a className="mt-2 block break-all text-sm text-[#8b4a2b] hover:underline" href={`mailto:${order.customer_email}`}>
                              {order.customer_email}
                            </a>
                            <a className="mt-1.5 block text-sm text-[#8b4a2b] hover:underline" href={`tel:${order.customer_phone}`}>
                              {order.customer_phone}
                            </a>
                          </div>
                          <div>
                            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Delivery details</h3>
                            <p className="mt-2 break-words text-sm leading-6 text-stone-600">
                              {order.delivery_address}, {order.delivery_city}{order.delivery_notes && <span className="block text-xs text-stone-400">Note: {order.delivery_notes}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-4 sm:px-5">
                          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Items ordered</h3>
                          <ul className="space-y-2.5">
                            {order.items.map((item, index) => (
                              <li key={`${item.product_name}-${index}`} className="flex min-w-0 items-center gap-3 text-sm">
                                {item.product_image ? (
                                  <img
                                    src={item.product_image}
                                    alt={item.product_image_alt || item.product_name}
                                    loading="lazy"
                                    className="h-11 w-11 shrink-0 rounded-md bg-white object-cover"
                                  />
                                ) : (
                                  <span className="h-11 w-11 shrink-0 rounded-md bg-orange-50" aria-hidden="true" />
                                )}
                                <span className="min-w-0 flex-1 break-words text-stone-700">
                                  {item.product_name} <span className="text-stone-400">({item.weight}) × {item.quantity}</span>
                                </span>
                                <span className="shrink-0 text-right font-medium text-stone-800">
                                  {item.is_wholesale && <span className="mb-1 block rounded bg-[#f2e7dc] px-1.5 py-0.5 text-[10px] font-semibold text-[#80543d]">Wholesale</span>}
                                  {formatPrice(item.line_total)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'Products' && (
            <section aria-labelledby="products-heading">
              {isProductEditorOpen ? (
                <SectionHeading
                  eyebrow="Catalog management"
                  title={editingProduct ? 'Edit product' : 'Add product'}
                  description="Complete the product details and save it to the storefront catalog."
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductEditorOpen(false)
                      setProductError('')
                    }}
                    className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Back to products
                  </button>
                </SectionHeading>
              ) : (
                <SectionHeading
                  eyebrow="Catalog management"
                  title="Products"
                  description={`${productsPage?.count ?? summary?.products ?? 0} products in your catalog`}
                >
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <SearchBox
                      value={productSearch}
                      onChange={value => {
                        setProductSearch(value)
                        setProductPageNumber(1)
                        setProductError('')
                      }}
                      label="Search products"
                    />
                    <button
                      type="button"
                      onClick={startNewProduct}
                      className="min-h-10 shrink-0 rounded-lg bg-[#593a27] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#40291d]"
                    >
                      Add
                    </button>
                  </div>
                </SectionHeading>
              )}

              {productError && (
                <p role="alert" className="mb-4 break-words border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {productError}
                </p>
              )}
              {productSuccess && (
                <p role="status" className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {productSuccess}
                </p>
              )}

              <div className={isProductEditorOpen
                ? 'mx-auto grid w-full max-w-3xl grid-cols-1 items-start gap-5'
                : 'block'
              }>
                {!isProductEditorOpen && <div className="min-w-0">
                  {isProductLoading ? (
                    <p role="status" className="border-y border-stone-200 py-6 text-center text-sm text-stone-500">Loading products…</p>
                  ) : productsPage?.results.length ? (
                    <div className="grid grid-cols-2 items-stretch gap-3 xl:grid-cols-1 xl:gap-0 xl:divide-y xl:border-y xl:border-stone-200 xl:bg-white">
                      {productsPage.results.map(product => (
                        <article key={product.slug} className="flex h-full min-w-0 flex-col gap-2 rounded-lg border border-stone-200 bg-white p-2.5 sm:gap-3 sm:p-3 xl:flex-row xl:items-center xl:rounded-none xl:border-0 xl:p-4">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.image_alt || product.name}
                              loading="lazy"
                              className="aspect-square w-full shrink-0 rounded-lg bg-stone-100 object-cover xl:h-16 xl:w-16"
                            />
                          ) : (
                            <div aria-hidden="true" className="aspect-square w-full shrink-0 rounded-lg bg-stone-100 xl:h-16 xl:w-16" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="break-words text-sm font-semibold text-stone-900">{product.name}</h2>
                              <StatusBadge>{product.is_active ? 'published' : 'unpublished'}</StatusBadge>
                            </div>
                            <p className="mt-1 break-all text-xs text-stone-400">
                              {product.slug} · {product.coffee_type} · {product.weight} · {product.roast}
                            </p>
                            <p className="mt-1 text-sm font-medium text-stone-700">
                              {formatPrice(product.price)}
                              {product.wholesale_price && <span className="ml-2 text-xs text-stone-500">Wholesale {formatPrice(product.wholesale_price)}</span>}
                            </p>
                          </div>
                          <div className="mt-auto grid grid-cols-2 gap-2 pt-2 xl:mt-0 xl:flex xl:flex-wrap xl:justify-end xl:pt-0">
                            <button
                              type="button"
                              onClick={() => editProduct(product)}
                              className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductPublished(product)}
                              className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                            >
                              {product.is_active ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(product)}
                              className="col-span-2 min-h-10 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 sm:col-span-1"
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="border-y border-stone-200 bg-white">
                      <EmptyState
                        title={productSearch ? 'No matching products' : 'No products yet'}
                        description={productSearch ? 'Try another product name, slug, or roast.' : 'Add your first product using the form.'}
                      />
                    </div>
                  )}
                  {productsPage && productsPage.count > 20 && (
                    <nav aria-label="Product list pages" className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={!productsPage.previous || isProductLoading}
                        onClick={() => {
                          setProductError('')
                          setProductPageNumber(page => page - 1)
                        }}
                        className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-center text-xs text-stone-500">{productsPage.count} products · Page {productPageNumber}</span>
                      <button
                        type="button"
                        disabled={!productsPage.next || isProductLoading}
                        onClick={() => {
                          setProductError('')
                          setProductPageNumber(page => page + 1)
                        }}
                        className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </div>}

                {isProductEditorOpen && <form onSubmit={saveProduct} className="min-w-0 space-y-4 border-y border-stone-200 bg-white p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-stone-900">{editingProduct ? 'Edit product' : 'Add a product'}</h2>
                      <p className="mt-1 text-xs leading-5 text-stone-500">Product details appear in the storefront when published.</p>
                    </div>
                    {editingProduct && (
                      <button type="button" onClick={startNewProduct} className="text-xs font-semibold text-[#8b4a2b] hover:underline">
                        Add new
                      </button>
                    )}
                  </div>

                  <div className="relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-4 text-center transition hover:border-[#c77a4b] hover:bg-orange-50/30 focus-within:border-[#c77a4b]">
                    {productImagePreview ? (
                      <img
                        src={productImagePreview}
                        alt={productForm.image_alt || 'Product preview'}
                        className="max-h-56 w-full rounded-lg object-contain"
                      />
                    ) : (
                      <div aria-hidden="true" className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f7efe7] text-2xl text-[#70432d]">
                        +
                      </div>
                    )}
                    <span className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-[#593a27] px-4 py-2 text-sm font-semibold text-white">
                      {productImagePreview ? 'Choose a different photo' : 'Choose photo'}
                    </span>
                    <span className="mt-2 text-xs text-stone-500">JPEG, PNG, or WebP · maximum 5 MB</span>
                    <input
                      aria-label="Choose product photo"
                      required={!editingProduct && !productForm.image}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={event => {
                        const file = event.target.files?.[0] || null
                        setProductImageFile(file)
                        setProductImagePreview(file ? URL.createObjectURL(file) : productForm.image)
                        setProductError('')
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>

                  <label className="block text-xs font-medium text-stone-700">
                    Product name
                    <input
                      required
                      value={productForm.name}
                      onChange={event => {
                        const name = event.target.value
                        setProductForm(current => ({
                          ...current,
                          name,
                          ...(!editingProduct ? {
                            slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                          } : {}),
                        }))
                      }}
                      className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100"
                    />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Product URL slug
                    <input
                      required
                      disabled={Boolean(editingProduct)}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      title="Use lowercase letters, numbers, and hyphens."
                      value={productForm.slug}
                      onChange={event => setProductForm(current => ({ ...current, slug: event.target.value }))}
                      className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100"
                    />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Type of coffee
                    <select
                      required
                      value={productForm.coffee_type}
                      onChange={event => setProductForm(current => ({ ...current, coffee_type: event.target.value }))}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="arabica">Arabica</option>
                      <option value="robusta">Robusta</option>
                      <option value="blend">Blend</option>
                      <option value="ground">Ground coffee</option>
                      <option value="green">Green beans</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block min-w-0 text-xs font-medium text-stone-700">
                      Package weight
                      <input required value={productForm.weight} onChange={event => setProductForm(current => ({ ...current, weight: event.target.value }))} placeholder="500g" className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                    </label>
                    <label className="block min-w-0 text-xs font-medium text-stone-700">
                      Roast
                      <input required value={productForm.roast} onChange={event => setProductForm(current => ({ ...current, roast: event.target.value }))} placeholder="Medium roast" className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block min-w-0 text-xs font-medium text-stone-700">
                      Retail price (UGX)
                      <input required min="0" step="1" type="number" value={productForm.price} onChange={event => setProductForm(current => ({ ...current, price: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                    </label>
                    <label className="block min-w-0 text-xs font-medium text-stone-700">
                      Wholesale price
                      <input min="0" step="1" type="number" value={productForm.wholesale_price} onChange={event => setProductForm(current => ({ ...current, wholesale_price: event.target.value }))} placeholder="Optional" className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                    </label>
                  </div>
                  <label className="block text-xs font-medium text-stone-700">
                    Short description
                    <textarea required rows="2" value={productForm.description} onChange={event => setProductForm(current => ({ ...current, description: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Product details
                    <textarea required rows="3" value={productForm.details} onChange={event => setProductForm(current => ({ ...current, details: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Tasting notes
                    <input required value={productForm.tasting_notes} onChange={event => setProductForm(current => ({ ...current, tasting_notes: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Image description
                    <input required value={productForm.image_alt} onChange={event => setProductForm(current => ({ ...current, image_alt: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                  </label>
                  <label className="flex min-h-10 items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" checked={productForm.is_active} onChange={event => setProductForm(current => ({ ...current, is_active: event.target.checked }))} className="h-4 w-4 accent-[#593a27]" />
                    Publish this product
                  </label>
                  <SavingButton
                    type="submit"
                    isSaving={isProductSaving}
                    savingLabel={productImageFile ? 'Uploading image and saving…' : 'Saving product…'}
                    className="min-h-11 w-full rounded-lg bg-[#593a27] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#40291d]"
                  >
                    {editingProduct ? 'Save product' : 'Create product'}
                  </SavingButton>
                </form>}
              </div>
            </section>
          )}

          {activeTab === 'Settings' && (
            <section aria-labelledby="settings-heading" className="max-w-3xl">
              <SectionHeading
                eyebrow="Staff account"
                title="Settings"
                description="Manage your account details and sign-in password."
              />
              {accountError && <p role="alert" className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{accountError}</p>}
              {accountSuccess && <p role="status" className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{accountSuccess}</p>}
              <form onSubmit={saveAccount} className="space-y-5 border-y border-stone-200 bg-white p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-stone-900">Account details</h2>
                    <p className="mt-1 text-xs text-stone-500">Your email is used to sign in and cannot be changed here.</p>
                  </div>
                  {!isAccountEditing && (
                    <button type="button" onClick={() => setIsAccountEditing(true)} className="min-h-10 shrink-0 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Edit
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-stone-700">
                    First name
                    <input
                      disabled={!isAccountEditing}
                      value={accountForm.first_name}
                      onChange={event => setAccountForm(current => ({ ...current, first_name: event.target.value }))}
                      maxLength="150"
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                  <label className="block text-sm font-medium text-stone-700">
                    Last name
                    <input
                      disabled={!isAccountEditing}
                      value={accountForm.last_name}
                      onChange={event => setAccountForm(current => ({ ...current, last_name: event.target.value }))}
                      maxLength="150"
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-stone-700">
                  Sign-in email
                  <input value={user?.email || ''} readOnly aria-readonly="true" className="mt-1.5 min-h-11 w-full cursor-not-allowed rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500" />
                </label>
                {isAccountEditing && (
                  <div className="flex flex-wrap gap-2">
                    <SavingButton type="submit" isSaving={isAccountSaving} savingLabel="Saving account…" className="min-h-11 rounded-lg bg-[#593a27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#40291d]">
                      Save account details
                    </SavingButton>
                    <button type="button" onClick={() => {
                      setAccountForm({ first_name: user?.first_name || '', last_name: user?.last_name || '' })
                      setAccountError('')
                      setIsAccountEditing(false)
                    }} className="min-h-11 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Cancel
                    </button>
                  </div>
                )}
              </form>

              <form onSubmit={changePassword} className="mt-6 space-y-4 border-y border-stone-200 bg-white p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-stone-900">Change password</h2>
                    <p className="mt-1 text-xs leading-5 text-stone-500">Choose a strong password that you do not use elsewhere.</p>
                  </div>
                  {!isPasswordEditing && (
                    <button type="button" onClick={() => setIsPasswordEditing(true)} className="min-h-10 shrink-0 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Edit
                    </button>
                  )}
                </div>
                {passwordError && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{passwordError}</p>}
                {passwordSuccess && <p role="status" className="border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{passwordSuccess}</p>}
                {[
                  ['current_password', 'Current password', 'current-password'],
                  ['new_password', 'New password', 'new-password'],
                  ['confirm_password', 'Confirm new password', 'new-password'],
                ].map(([field, label, autocomplete]) => (
                  <label key={field} className="block text-sm font-medium text-stone-700">
                    {label}
                    <input
                      disabled={!isPasswordEditing}
                      required
                      type="password"
                      minLength={field === 'current_password' ? undefined : 8}
                      autoComplete={autocomplete}
                      value={passwordForm[field]}
                      onChange={event => setPasswordForm(current => ({ ...current, [field]: event.target.value }))}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                ))}
                {isPasswordEditing && (
                  <div className="flex flex-wrap gap-2">
                    <SavingButton type="submit" isSaving={isPasswordSaving} savingLabel="Updating password…" className="min-h-11 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Update password
                    </SavingButton>
                    <button type="button" onClick={() => {
                      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
                      setPasswordError('')
                      setIsPasswordEditing(false)
                    }} className="min-h-11 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Cancel
                    </button>
                  </div>
                )}
              </form>

              <section aria-labelledby="admin-accounts-heading" className="mt-6 border-y border-stone-200 bg-white p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 id="admin-accounts-heading" className="text-base font-semibold text-stone-900">Administrator accounts</h2>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      Add trusted staff or remove admin access. At least one active administrator must always remain.
                    </p>
                  </div>
                  {!isNewAdminEditing && (
                    <button type="button" onClick={() => setIsNewAdminEditing(true)} className="min-h-10 shrink-0 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Edit
                    </button>
                  )}
                </div>
                {adminsError && <p role="alert" className="mt-4 break-words border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{adminsError}</p>}
                {adminSuccess && <p role="status" className="mt-4 border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{adminSuccess}</p>}

                <form onSubmit={createAdmin} className="mt-5 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-stone-700">
                    Username
                    <input
                      disabled={!isNewAdminEditing}
                      required
                      autoComplete="off"
                      value={newAdmin.username}
                      onChange={event => setNewAdmin(current => ({ ...current, username: event.target.value }))}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Email address
                    <input
                      disabled={!isNewAdminEditing}
                      required
                      type="email"
                      autoComplete="off"
                      value={newAdmin.email}
                      onChange={event => setNewAdmin(current => ({ ...current, email: event.target.value }))}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                  <label className="block text-xs font-medium text-stone-700 sm:col-span-2">
                    Temporary password
                    <input
                      disabled={!isNewAdminEditing}
                      required
                      type="password"
                      minLength="8"
                      autoComplete="new-password"
                      value={newAdmin.password}
                      onChange={event => setNewAdmin(current => ({ ...current, password: event.target.value }))}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                  {isNewAdminEditing && (
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <SavingButton type="submit" isSaving={isAdminSaving} savingLabel="Creating administrator…" className="min-h-11 rounded-lg bg-[#593a27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#40291d]">
                        Add administrator
                      </SavingButton>
                      <button type="button" onClick={() => {
                        setNewAdmin({ username: '', email: '', password: '' })
                        setAdminsError('')
                        setIsNewAdminEditing(false)
                      }} className="min-h-11 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                        Cancel
                      </button>
                    </div>
                  )}
                </form>

                <ul className="mt-5 divide-y divide-stone-100 border-y border-stone-100">
                  {admins.map(admin => {
                    const activeAdminCount = admins.filter(item => item.is_active).length
                    const isLastActiveAdmin = admin.is_active && activeAdminCount <= 1
                    return (
                      <li key={admin.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="break-all text-sm font-medium text-stone-800">{admin.email}</p>
                          <p className="mt-0.5 break-all text-xs text-stone-400">
                            @{admin.username}{admin.id === user?.id ? ' · You' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge>{admin.is_active ? 'active' : 'inactive'}</StatusBadge>
                          <button
                            type="button"
                            disabled={isLastActiveAdmin || deletingAdminId === admin.id}
                            title={isLastActiveAdmin ? 'At least one active administrator must remain.' : `Delete ${admin.email}`}
                            onClick={() => removeAdmin(admin)}
                            className="min-h-10 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingAdminId === admin.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            </section>
          )}

          {activeTab === 'Subscribers' && (
            <section aria-labelledby="subscribers-heading">
              <SectionHeading
                eyebrow="Newsletter audience"
                title="Subscribers"
                description={`${subscribersPage?.count ?? summary?.active_subscribers ?? 0} newsletter subscribers`}
              >
                <SearchBox
                  value={subscriberSearch}
                  onChange={value => {
                    setSubscriberSearch(value)
                    setSubscriberPageNumber(1)
                    setSubscribersError('')
                  }}
                  label="Search subscribers"
                />
              </SectionHeading>
              {subscribersError && (
                <p role="alert" className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  Could not load newsletter subscribers: {subscribersError}
                </p>
              )}
              {isSubscribersLoading ? (
                <p role="status" className="border-y border-stone-200 py-6 text-center text-sm text-stone-500">Loading subscribers…</p>
              ) : subscribersPage?.results.length ? (
                <>
                  <ul className="divide-y divide-stone-200 border-y border-stone-200 bg-white">
                    {subscribersPage.results.map(subscriber => (
                      <li key={subscriber.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                        <div className="min-w-0">
                          <a className="break-all text-sm font-semibold text-[#8b4a2b] hover:underline" href={`mailto:${subscriber.email}`}>
                            {subscriber.email}
                          </a>
                          <p className="mt-1 text-xs text-stone-500">
                            Subscribed {formatDate(subscriber.subscribed_at)}
                          </p>
                        </div>
                        <StatusBadge>{subscriber.is_active ? 'active' : 'unsubscribed'}</StatusBadge>
                      </li>
                    ))}
                  </ul>
                  {subscribersPage.count > 20 && (
                    <nav aria-label="Subscriber list pages" className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={!subscribersPage.previous || isSubscribersLoading}
                        onClick={() => setSubscriberPageNumber(page => page - 1)}
                        className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-center text-xs text-stone-500">
                        {subscribersPage.count} subscribers · Page {subscriberPageNumber}
                      </span>
                      <button
                        type="button"
                        disabled={!subscribersPage.next || isSubscribersLoading}
                        onClick={() => setSubscriberPageNumber(page => page + 1)}
                        className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </>
              ) : (
                <div className="border-y border-stone-200 bg-white">
                  <EmptyState
                    title={subscriberSearch ? 'No matching subscribers' : 'No subscribers yet'}
                    description={subscriberSearch ? 'Try another email address.' : 'New newsletter signups will appear here.'}
                  />
                </div>
              )}
            </section>
          )}

          {activeTab === 'Users' && (
            <section aria-labelledby="users-heading">
              <SectionHeading
                eyebrow="Customer accounts"
                title="Users"
                description={`${usersPage?.count ?? summary?.users ?? 0} customer accounts`}
              >
                <SearchBox value={userSearch} onChange={changeUserSearch} label="Search users" />
              </SectionHeading>
              {usersError && (
                <p role="alert" className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  Could not load customer accounts: {usersError}
                </p>
              )}
              {isUsersLoading ? (
                <p role="status" className="border-y border-stone-200 py-6 text-center text-sm text-stone-500">Loading users…</p>
              ) : usersPage?.results.length ? (
                <>
                  <ul className="divide-y divide-stone-200 border-y border-stone-200 bg-white sm:hidden">
                    {usersPage.results.map(customer => (
                      <li key={customer.id} className="space-y-2.5 px-3 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-stone-800">{customer.name}</p>
                            <a className="mt-1 block break-all text-xs text-[#8b4a2b] hover:underline" href={`mailto:${customer.email}`}>
                              {customer.email}
                            </a>
                          </div>
                          <StatusBadge>{customer.is_active ? 'active' : 'inactive'}</StatusBadge>
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <dt className="text-stone-400">Orders</dt>
                            <dd className="mt-0.5 font-medium text-stone-700">{customer.order_count}</dd>
                          </div>
                          <div>
                            <dt className="text-stone-400">Joined</dt>
                            <dd className="mt-0.5 text-stone-600">{formatDate(customer.date_joined)}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-stone-400">Last sign-in</dt>
                            <dd className="mt-0.5 text-stone-600">{customer.last_login ? formatDate(customer.last_login) : 'Never'}</dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto border-y border-stone-200 bg-white sm:block">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                          <th scope="col" className="px-4 py-3 sm:px-5">Customer</th>
                          <th scope="col" className="px-4 py-3 sm:px-5">Account status</th>
                          <th scope="col" className="px-4 py-3 sm:px-5">Orders</th>
                          <th scope="col" className="px-4 py-3 sm:px-5">Joined</th>
                          <th scope="col" className="px-4 py-3 sm:px-5">Last sign-in</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {usersPage.results.map(customer => (
                          <tr key={customer.id} className="transition-colors hover:bg-stone-50/70">
                            <td className="px-4 py-4 sm:px-5">
                              <p className="font-semibold text-stone-800">{customer.name}</p>
                              <a className="mt-1 inline-block text-xs text-[#8b4a2b] hover:underline" href={`mailto:${customer.email}`}>
                                {customer.email}
                              </a>
                            </td>
                            <td className="px-4 py-4 sm:px-5">
                              <StatusBadge>{customer.is_active ? 'active' : 'inactive'}</StatusBadge>
                            </td>
                            <td className="px-4 py-4 font-medium tabular-nums text-stone-700 sm:px-5">{customer.order_count}</td>
                            <td className="px-4 py-4 text-xs text-stone-500 sm:px-5">{formatDate(customer.date_joined)}</td>
                            <td className="px-4 py-4 text-xs text-stone-500 sm:px-5">
                              {customer.last_login ? formatDate(customer.last_login) : 'Never'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="border-y border-stone-200 bg-white">
                  <EmptyState
                    title={userSearch ? 'No matching users' : 'No customer accounts yet'}
                    description={userSearch ? 'Try another name or email address.' : 'Customer accounts will appear here after they sign up.'}
                  />
                </div>
              )}
              {usersPage && usersPage.count > 20 && (
                <nav aria-label="User list pages" className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={!usersPage.previous || isUsersLoading}
                    onClick={() => setUserPageNumber(page => page - 1)}
                    className="border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-stone-500">
                    {usersPage.count} users · Page {userPageNumber}
                  </span>
                  <button
                    type="button"
                    disabled={!usersPage.next || isUsersLoading}
                    onClick={() => setUserPageNumber(page => page + 1)}
                    className="border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
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
