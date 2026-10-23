import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { FiChevronDown, FiX } from 'react-icons/fi'
import {
  LuShoppingCart,
  LuUserRound,
} from 'react-icons/lu'
import { useCart } from '../context/useCart.js'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Partner With Us', to: '/partner' },
  { label: 'Contact Us', to: '/contact' },
]

export default function Navbar() {
  const { cartCount } = useCart()
  const { isAuthenticated, user, token, signOut } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [dropdown, setDropdown] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null)
  const [authMessage, setAuthMessage] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const accountMenuRef = useRef(null)
  const accountLinks = [
    { label: 'Profile', to: '/profile#profile-heading' },
    { label: 'Notifications', to: '/notifications' },
    { label: 'Change location', to: '/profile#location-heading' },
    { label: 'Change details', to: '/profile#change-details-heading' },
    { label: 'My orders', to: '/my-orders' },
    { label: 'Delete account', to: '/profile#account-actions-heading' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0)
      return
    }

    let isCurrent = true
    const loadUnreadCount = async () => {
      try {
        const data = await apiRequest('/auth/notifications/', { token })
        if (isCurrent) setUnreadCount(data.unread_count)
      } catch (requestError) {
        if (isCurrent) setAuthMessage(requestError.message)
      }
    }
    const refreshUnreadCount = () => loadUnreadCount()

    loadUnreadCount()
    window.addEventListener('legacy-notifications-updated', refreshUnreadCount)
    return () => {
      isCurrent = false
      window.removeEventListener('legacy-notifications-updated', refreshUnreadCount)
    }
  }, [isAuthenticated, token, location.pathname])

  // prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    if (!accountOpen) return

    const handlePointerDown = event => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [accountOpen])

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur shadow-md' : 'bg-peach'}`}>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex-shrink-0" onClick={() => setMenuOpen(false)}>
            <img src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792498215/Legacy_logo.png" alt="Legacy Coffee" className="h-10 md:h-12 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <li key={link.label} className="relative shrink-0">
                {link.children ? (
                  <div onMouseEnter={() => setDropdown(link.label)} onMouseLeave={() => setDropdown(null)}>
                    <button className="flex items-center gap-1 px-4 py-2 rounded-full text-brown hover:bg-peach-light hover:text-primary font-medium transition-all text-sm">
                      {link.label} <FiChevronDown size={13} className={`transition-transform ${dropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdown === link.label && (
                      <ul className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-2xl py-2 min-w-44 z-50 border border-peach-light">
                        {link.children.map(child => (
                          <li key={child.label}>
                            <Link to={child.to} className="flex items-center px-4 py-2.5 text-brown hover:bg-peach-light hover:text-primary transition-colors text-sm">
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <NavLink to={link.to} end={link.to === '/'}
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-full font-medium text-sm transition-all ${isActive ? 'bg-primary text-white shadow-sm' : 'text-brown hover:bg-peach-light hover:text-primary'}`
                    }>
                    {link.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>

          <div className="absolute right-14 top-1/2 flex -translate-y-1/2 items-center gap-3 md:static md:translate-y-0">
            <div ref={accountMenuRef} className="relative hidden md:block">
              <button
                type="button"
                aria-label="My account"
                aria-expanded={accountOpen}
                aria-controls="account-menu"
                onClick={() => setAccountOpen(open => !open)}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/40 text-brown transition-colors hover:bg-peach-light hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:h-10 md:w-10 md:bg-transparent"
              >
                <LuUserRound aria-hidden="true" size={21} />
                {unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} unread notifications`}
                    className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-peach"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {accountOpen && (
                <div id="account-menu" className="absolute left-1/2 top-full z-[60] mt-2 max-h-[calc(100vh-6rem)] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto border border-peach-mid/60 bg-white p-4 text-left shadow-xl sm:p-5">
                  {isAuthenticated ? (
                    <>
                      <nav aria-label="Account links">
                        {accountLinks.map(({ label, to }) => (
                          <Link
                            key={label}
                            to={to}
                            onClick={() => setAccountOpen(false)}
                            className={`block px-2 py-2 text-sm font-semibold transition-colors hover:bg-peach-light hover:text-primary ${
                              label === 'Delete account' ? 'text-red-700' : 'text-brown'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {label === 'Profile' && user?.profile_photo && (
                                <img
                                  src={user.profile_photo}
                                  alt=""
                                  className="h-6 w-6 rounded-full object-cover"
                                />
                              )}
                              {label === 'Notifications' && unreadCount > 0
                                ? `Notifications (${unreadCount})`
                                : label}
                            </span>
                          </Link>
                        ))}
                      </nav>
                      <div className="mt-4 border-t border-peach-mid/40 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountOpen(false)
                            signOut().catch(() => setAuthMessage('Signed out locally; the server session could not be cleared.'))
                          }}
                          className="block w-full px-2 py-2 text-left text-sm font-semibold text-brown/70 transition-colors hover:bg-peach-light hover:text-primary"
                        >
                          Sign out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-brown">Welcome to Legacy Coffee</p>
                      <p className="mt-1 text-sm text-brown/65">Sign in to view your account and orders. You can create an account from the sign-in page.</p>
                      <div className="mt-4">
                        <Link
                          to="/signin"
                          onClick={() => setAccountOpen(false)}
                          className="block bg-primary px-3 py-2 text-center text-sm font-semibold text-white hover:bg-brown"
                        >
                          Sign in
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <Link
              to="/cart"
              aria-label={`Shopping cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/40 text-brown transition-colors hover:bg-peach-light hover:text-primary md:h-10 md:w-10 md:bg-transparent"
            >
              <LuShoppingCart aria-hidden="true" size={23} />
              <span aria-hidden="true" className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white ring-2 ring-peach">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            </Link>
            <Link to="/#quote" className="hidden shrink-0 whitespace-nowrap rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brown md:block">
              Get a Quote
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-full hover:bg-peach-light transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-brown transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-brown transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-brown transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* backdrop */}
        <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />

        {/* drawer */}
        <div className={`absolute top-0 right-0 h-full w-4/5 max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-peach-light">
            <img src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792498215/Legacy_logo.png" alt="Legacy Coffee" className="h-9 w-auto" />
            <button onClick={() => setMenuOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-peach-light text-brown hover:bg-primary hover:text-white transition-colors">
              <FiX size={18} />
            </button>
          </div>

          {/* links */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            {navLinks.map(link => (
              <div key={link.label}>
                {link.children ? (
                  <>
                    <button
                      onClick={() => setOpenMobileDropdown(openMobileDropdown === link.label ? null : link.label)}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-brown font-semibold text-base hover:bg-peach-light transition-colors"
                    >
                      {link.label}
                      <FiChevronDown size={16} className={`transition-transform ${openMobileDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {openMobileDropdown === link.label && (
                      <div className="ml-4 mb-1 border-l-2 border-primary/30 pl-3">
                        {link.children.map(child => (
                          <Link key={child.label} to={child.to}
                            className="block py-2.5 px-3 text-sm text-brown/70 hover:text-primary transition-colors"
                            onClick={() => setMenuOpen(false)}>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <NavLink to={link.to}
                    className={({ isActive }) =>
                      `block px-4 py-3.5 rounded-xl font-semibold text-base transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-brown hover:bg-peach-light'}`
                    }
                    onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </NavLink>
                )}
              </div>
            ))}
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/my-account"
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-brown hover:bg-peach-light'}`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  My account
                </NavLink>
                <NavLink
                  to="/my-orders"
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-brown hover:bg-peach-light'}`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  My orders
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    signOut().catch(() => setAuthMessage('Signed out locally; the server session could not be cleared.'))
                  }}
                  className="w-full rounded-xl px-4 py-3.5 text-left text-base font-semibold text-brown transition-colors hover:bg-peach-light"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/signin"
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-brown hover:bg-peach-light'}`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  Sign in
                </NavLink>
              </>
            )}
          </nav>

          {/* CTA */}
          <div className="px-6 py-5 border-t border-peach-light">
            <Link to="/#quote"
              className="block text-center bg-primary text-white px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-brown transition-colors"
              onClick={() => setMenuOpen(false)}>
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
      {authMessage && (
        <p role="status" className="fixed bottom-4 left-4 z-[60] bg-black px-4 py-2 text-xs text-white">
          {authMessage}
        </p>
      )}
    </>
  )
}
