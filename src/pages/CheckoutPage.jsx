import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LuArrowLeft, LuCheck, LuClipboardList, LuMapPin, LuShieldCheck } from 'react-icons/lu'
import { formatPrice } from '../data/products.js'
import { useCart } from '../context/useCart.js'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'
import ProductImage from '../components/ProductImage.jsx'

const inputClass = 'mt-1.5 w-full border border-peach-mid bg-white px-3.5 py-3 text-sm text-black outline-none transition-colors placeholder:text-black/40 focus:border-primary focus:ring-2 focus:ring-primary/20'
const labelClass = 'block text-sm font-medium text-black'

export default function CheckoutPage() {
  const { items, cartTotal, saveOrder, wholesaleDetails } = useCart()
  const { isAuthenticated, token, user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(() => ({
    name: wholesaleDetails?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' '),
    business_name: wholesaleDetails?.business_name || '',
    email: user?.email || '',
    phone: '',
    address: user?.delivery_address || '',
    city: user?.delivery_city || '',
    notes: user?.delivery_notes || '',
  }))
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const cartCount = items.reduce((total, item) => total + item.quantity, 0)

  if (items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const handleChange = event => setCustomer(current => ({ ...current, [event.target.name]: event.target.value }))

  const handleSubmit = async event => {
    event.preventDefault()
    setSubmitError('')
    setIsSubmitting(true)

    try {
      const result = await apiRequest('/orders/', {
        method: 'POST',
        token,
        body: {
          customer_name: customer.name,
          business_name: customer.business_name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          delivery_address: customer.address,
          delivery_city: customer.city,
          delivery_notes: customer.notes,
          items: items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            is_wholesale: Boolean(item.is_wholesale),
          })),
        },
      })

      updateUser({
        ...user,
        delivery_address: result.delivery_address,
        delivery_city: result.delivery_city,
        delivery_notes: result.delivery_notes,
      })

      const order = {
        id: result.reference,
        status: result.status,
        customer: {
          name: result.customer_name,
          business_name: result.business_name,
          email: result.customer_email,
          phone: result.customer_phone,
          address: result.delivery_address,
          city: result.delivery_city,
          notes: result.delivery_notes,
        },
        items: result.order_items.map((orderItem, index) => ({
          ...items[index],
          price: Number(orderItem.unit_price),
          quantity: orderItem.quantity,
        })),
        total: Number(result.total),
        createdAt: result.created_at,
      }
      saveOrder(order)
      navigate('/confirm', { state: { order } })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="bg-[#fffdfa] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link to="/cart" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-black transition-colors hover:text-primary">
          <LuArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to cart
        </Link>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">Almost there</p>
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">Checkout</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-black">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F58537] text-white"><LuCheck aria-hidden="true" className="h-4 w-4" /></span>
            Secure order request
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="mx-auto max-w-xl border border-peach-mid/50 bg-white p-6 text-center shadow-sm sm:p-8">
            <LuShieldCheck aria-hidden="true" className="mx-auto h-9 w-9 text-primary" />
            <h2 className="mt-3 text-xl font-bold text-black">Sign in to place your order</h2>
            <p className="mt-2 text-sm leading-relaxed text-black/70">
              Your cart is saved. Sign in or create an account to continue with delivery details and submit your order request.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link to="/signin" state={{ from: '/checkout' }} className="bg-[#F58537] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#e8742b]">
                Sign in
              </Link>
              <Link to="/signup" state={{ from: '/checkout' }} className="border border-black px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-peach-light">
                Sign up
              </Link>
            </div>
            <Link to="/cart" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-black/70 underline underline-offset-2 hover:text-primary">
              <LuArrowLeft aria-hidden="true" className="h-4 w-4" />
              Return to cart
            </Link>
          </div>
        ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="border border-peach-mid/50 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-peach-mid/40 pb-4">
                <span className="flex h-9 w-9 items-center justify-center bg-peach-light text-black"><LuMapPin aria-hidden="true" className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-bold text-brown">Delivery details</h2>
                  <p className="mt-0.5 text-xs text-black">Where should we deliver your order?</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass} htmlFor="checkout-name">
                  Full name
                  <input id="checkout-name" required autoComplete="name" name="name" value={customer.name} onChange={handleChange} placeholder="e.g. Alex Namusoke" className={inputClass} />
                </label>
                {wholesaleDetails && (
                  <label className={labelClass} htmlFor="checkout-business">
                    Business name <span className="font-normal text-black/55">(optional)</span>
                    <input id="checkout-business" autoComplete="organization" name="business_name" value={customer.business_name} onChange={handleChange} placeholder="Your café or business" className={inputClass} />
                  </label>
                )}
                <label className={labelClass} htmlFor="checkout-email">
                  Email address
                  <input id="checkout-email" required type="email" autoComplete="email" name="email" value={customer.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
                </label>
                <label className={labelClass} htmlFor="checkout-phone">
                  Phone number
                  <input id="checkout-phone" required type="tel" autoComplete="tel" name="phone" value={customer.phone} onChange={handleChange} placeholder="+256 700 000 000" className={inputClass} />
                </label>
                <label className={labelClass} htmlFor="checkout-city">
                  Town or city
                  <input id="checkout-city" required autoComplete="address-level2" name="city" value={customer.city} onChange={handleChange} placeholder="e.g. Kampala" className={inputClass} />
                </label>
                <label className={`${labelClass} sm:col-span-2`} htmlFor="checkout-address">
                  Street address
                  <input id="checkout-address" required autoComplete="street-address" name="address" value={customer.address} onChange={handleChange} placeholder="Street, building, or delivery location" className={inputClass} />
                </label>
                <label className={`${labelClass} sm:col-span-2`} htmlFor="checkout-notes">
                  Delivery notes <span className="font-normal text-black">(optional)</span>
                  <textarea id="checkout-notes" name="notes" value={customer.notes} onChange={handleChange} rows={3} placeholder="Helpful directions or delivery instructions" className={`${inputClass} resize-y`} />
                </label>
              </div>
            </section>

            <div className="flex items-start gap-3 border border-peach-mid/50 bg-peach-light/70 p-4 text-sm leading-relaxed text-black">
              <LuShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <p>This checkout places an order request only. Our team will contact you to confirm delivery and payment details. No payment is collected online.</p>
            </div>
            {submitError && (
              <p role="alert" className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                {submitError}{' '}
                {submitError.toLowerCase().includes('credentials') || submitError.toLowerCase().includes('token')
                  ? <Link to="/signin" state={{ from: '/checkout' }} className="font-semibold underline">Sign in again</Link>
                  : null}
              </p>
            )}
            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#F58537] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#e8742b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                {isSubmitting ? 'Sending order…' : 'Place order request'}
              </button>
            </div>
          </form>

          <aside className="h-fit border border-peach-mid/50 bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-6">
            <div className="mb-5 flex items-center gap-3 border-b border-peach-mid/40 pb-4">
              <span className="flex h-9 w-9 items-center justify-center bg-peach-light text-black"><LuClipboardList aria-hidden="true" className="h-5 w-5" /></span>
              <div>
                <h2 className="font-bold text-brown">Order summary</h2>
                <p className="mt-0.5 text-xs text-black">{cartCount} {cartCount === 1 ? 'item' : 'items'}</p>
              </div>
            </div>
            <ul className="mb-5 max-h-72 space-y-4 overflow-y-auto">
              {items.map(item => (
                <li key={item.id} className="flex items-center gap-3 text-sm text-black">
                  <div className="h-14 w-14 shrink-0 overflow-hidden bg-peach-light">
                    <ProductImage product={item} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="mt-0.5 text-xs text-black">{item.weight} · Qty {item.quantity}</p>
                  </div>
                  <span className="shrink-0 text-right text-xs font-semibold sm:text-sm">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-peach-mid/50 pt-4 text-sm text-black">
              <div className="flex justify-between gap-4">
                <span>Subtotal</span><span className="font-semibold">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between gap-4 text-xs text-black">
                <span>Delivery</span><span>Confirmed after order</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-peach-mid/50 pt-3 text-base font-bold">
                <span>Total</span><span>{formatPrice(cartTotal)}</span>
              </div>
            </div>
            <Link to="/cart" className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-black underline underline-offset-2 transition-colors hover:text-primary">
              <LuArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
              Edit cart
            </Link>
          </aside>
        </div>
        )}
      </div>
    </section>
  )
}
