import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import NewsletterSignup from './components/NewsletterSignup.jsx'
import Home from './pages/Home'
import AboutUs from './pages/AboutUs'
import PartnerWithUs from './pages/PartnerWithUs'
import WholesalePage from './pages/WholesalePage'
import ContactUs from './pages/ContactUs'
import Newsletter from './pages/Newsletter'
import AdminDashboard from './pages/AdminDashboard'
import ProductPage from './pages/ProductPage'
import ReviewPage from './pages/ReviewPage.jsx'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ConfirmationPage from './pages/ConfirmationPage'
import MyOrdersPage from './pages/MyOrdersPage'
import MyAccountPage from './pages/MyAccountPage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import TermsAndConditions from './pages/TermsAndConditions.jsx'
import CookiePolicy from './pages/CookiePolicy.jsx'
import CookieConsentManager from './components/CookieConsentManager.jsx'
import { CookieConsentProvider } from './context/CookieConsentContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import AuthPage from './pages/AuthPage'
import PatrickStoryPage from './pages/PatrickStoryPage'
import { AuthProvider } from './context/AuthContext.jsx'

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return null
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
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
            <Routes>
              <Route path="/" element={<Layout><Home /></Layout>} />
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
              <Route path="/partner" element={<Layout><PartnerWithUs /></Layout>} />
              <Route path="/wholesale" element={<Layout><WholesalePage /></Layout>} />
              <Route path="/contact" element={<Layout><ContactUs /></Layout>} />
              <Route path="/newsletter" element={<Layout><Newsletter /></Layout>} />
              <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
              <Route path="/terms-and-conditions" element={<Layout><TermsAndConditions /></Layout>} />
              <Route path="/cookies" element={<Layout><CookiePolicy /></Layout>} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
            <CookieConsentManager />
          </CookieConsentProvider>
        </AuthProvider>
      </CartProvider>
    </BrowserRouter>
  )
}
