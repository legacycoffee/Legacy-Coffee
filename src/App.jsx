import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import AboutUs from './pages/AboutUs'
import PartnerWithUs from './pages/PartnerWithUs'
import ContactUs from './pages/ContactUs'
import Newsletter from './pages/Newsletter'
import AdminDashboard from './pages/AdminDashboard'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ConfirmationPage from './pages/ConfirmationPage'
import MyOrdersPage from './pages/MyOrdersPage'
import MyAccountPage from './pages/MyAccountPage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import { CartProvider } from './context/CartContext.jsx'
import AuthPage from './pages/AuthPage'
import PatrickStoryPage from './pages/PatrickStoryPage'
import { AuthProvider } from './context/AuthContext.jsx'

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <CartProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/about" element={<Layout><AboutUs /></Layout>} />
            <Route path="/about/patrick-muhereza" element={<Layout><PatrickStoryPage /></Layout>} />
            <Route path="/shop" element={<Navigate to="/" replace />} />
            <Route path="/products/:productId" element={<Layout><ProductPage /></Layout>} />
            <Route path="/cart" element={<Layout><CartPage /></Layout>} />
            <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
            <Route path="/my-orders" element={<Layout><MyOrdersPage /></Layout>} />
            <Route path="/my-account" element={<Layout><MyAccountPage /></Layout>} />
            <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
            <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
            <Route path="/signin" element={<Layout><AuthPage mode="signin" /></Layout>} />
            <Route path="/signup" element={<Layout><AuthPage mode="signup" /></Layout>} />
            <Route path="/confirm" element={<Layout><ConfirmationPage /></Layout>} />
            <Route path="/partner" element={<Layout><PartnerWithUs /></Layout>} />
            <Route path="/contact" element={<Layout><ContactUs /></Layout>} />
            <Route path="/newsletter" element={<Layout><Newsletter /></Layout>} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </AuthProvider>
      </CartProvider>
    </BrowserRouter>
  )
}
