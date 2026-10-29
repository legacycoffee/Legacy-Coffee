import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import NewsletterSignup from './components/NewsletterSignup.jsx'
import CookieConsentManager from './components/CookieConsentManager.jsx'
import VisitorAnalyticsTracker from './components/VisitorAnalyticsTracker.jsx'
import { CookieConsentProvider } from './context/CookieConsentContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

const Home = lazy(() => import('./pages/Home'))
const OurCoffeeFarm = lazy(() => import('./pages/OurCoffeeFarm'))
const OurServices = lazy(() => import('./pages/OurServices'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const WholesalePage = lazy(() => import('./pages/WholesalePage'))
const ContactUs = lazy(() => import('./pages/ContactUs'))
const Newsletter = lazy(() => import('./pages/Newsletter'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'))
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'))
const MyAccountPage = lazy(() => import('./pages/MyAccountPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy.jsx'))
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions.jsx'))
const CookiePolicy = lazy(() => import('./pages/CookiePolicy.jsx'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const PatrickStoryPage = lazy(() => import('./pages/PatrickStoryPage'))

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
      return
    }

    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<div className="px-6 py-16 text-center text-brown/70">Loading page…</div>}>
          {children}
        </Suspense>
      </main>
      <NewsletterSignup />
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <CartProvider>
        <AuthProvider>
          <CookieConsentProvider>
            <VisitorAnalyticsTracker />
            <Routes>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/coffee-farm" element={<Layout><OurCoffeeFarm /></Layout>} />
              <Route path="/services" element={<Layout><OurServices /></Layout>} />
              <Route path="/about" element={<Layout><AboutUs /></Layout>} />
              <Route path="/about/patrick-muhereza" element={<Layout><PatrickStoryPage /></Layout>} />
              <Route path="/shop" element={<Navigate to="/" replace />} />
              <Route path="/products/:productId" element={<Layout><ProductPage /></Layout>} />
              <Route path="/review/:productId" element={<Layout><ReviewPage /></Layout>} />
              <Route path="/cart" element={<Layout><CartPage /></Layout>} />
              <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
              <Route path="/my-orders" element={<Layout><MyOrdersPage /></Layout>} />
              <Route path="/my-account" element={<Layout><MyAccountPage /></Layout>} />
              <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
              <Route path="/notifications/:notificationId" element={<Layout><NotificationsPage /></Layout>} />
              <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
              <Route path="/signin" element={<Layout><AuthPage mode="signin" /></Layout>} />
              <Route path="/signup" element={<Layout><AuthPage mode="signup" /></Layout>} />
              <Route path="/confirm" element={<Layout><ConfirmationPage /></Layout>} />
              <Route path="/wholesale" element={<Layout><WholesalePage /></Layout>} />
              <Route path="/contact" element={<Layout><ContactUs /></Layout>} />
              <Route path="/newsletter" element={<Layout><Newsletter /></Layout>} />
              <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
              <Route path="/terms-and-conditions" element={<Layout><TermsAndConditions /></Layout>} />
              <Route path="/cookies" element={<Layout><CookiePolicy /></Layout>} />
              <Route path="/admin" element={
                <Suspense fallback={<div className="px-6 py-16 text-center text-brown/70">Loading page…</div>}>
                  <AdminDashboard />
                </Suspense>
              } />
            </Routes>
            <CookieConsentManager />
          </CookieConsentProvider>
        </AuthProvider>
      </CartProvider>
    </BrowserRouter>
  )
}
