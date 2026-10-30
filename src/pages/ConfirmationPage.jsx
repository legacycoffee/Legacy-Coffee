import { useEffect } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { LuArrowRight, LuCheck, LuClock3, LuCoffee, LuPackageCheck } from 'react-icons/lu'
import { formatPrice } from '../data/products.js'
import { useCart } from '../context/useCart.js'
import { useAuth } from '../context/useAuth.js'
import ProductImage from '../components/ProductImage.jsx'
import OrderInvoiceActions from '../components/OrderInvoiceActions.jsx'
import { getOrderUrl } from '../utils/orderUrl.js'

export default function ConfirmationPage() {
  const location = useLocation()
  const { latestOrder, clearCart } = useCart()
  const { token } = useAuth()
  const order = location.state?.order || latestOrder

  useEffect(() => {
    if (order) clearCart()
  }, [order, clearCart])

  if (!order?.id || !Array.isArray(order.items)) {
    return <Navigate to="/" replace />
  }

  const createdAt = order.createdAt ? new Date(order.createdAt) : null
  const formattedDate = createdAt && !Number.isNaN(createdAt.getTime())
    ? new Intl.DateTimeFormat('en-UG', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Africa/Kampala',
    }).format(createdAt)
    : null

  return (
    <section className="bg-[#fffdfa] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f3e9] text-[#28713b]">
            <LuCheck aria-hidden="true" className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Order request received</p>
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Thank you{order.customer?.name ? `, ${order.customer.name}` : ''}!
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-black/70 sm:text-base">
            We’ve received your coffee order request. Our team will be in touch to confirm delivery and payment details.
          </p>
          <div className="mt-5 flex justify-center">
            <OrderInvoiceActions reference={order.id} token={token} />
          </div>
          {order.public_id && (
            <Link
              to={getOrderUrl({ public_id: order.public_id, items: order.items })}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              View this order
              <LuArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          )}
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <section aria-labelledby="order-summary-title" className="border border-peach-mid/50 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-peach-mid/40 pb-4">
                <div>
                  <h2 id="order-summary-title" className="font-bold text-black">Order summary</h2>
                  {formattedDate && <p className="mt-1 text-xs text-black/60">Placed {formattedDate}</p>}
                </div>
                <div className="inline-flex items-center gap-1.5 border border-[#f3d4b9] bg-[#fff7ef] px-3 py-1.5 text-xs font-semibold capitalize text-[#8a4a1f]">
                  <LuClock3 aria-hidden="true" className="h-3.5 w-3.5" />
                  {order.status === 'pending' ? 'Awaiting confirmation' : order.status || 'Pending'}
                </div>
              </div>

              <div className="mb-4 flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-black/60">Order reference</span>
                <strong className="font-bold tracking-wide text-black">{order.id}</strong>
              </div>

              <ul className="space-y-4 border-y border-peach-mid/40 py-4">
                {order.items.map((item, index) => (
                  <li key={`${item.id || item.name}-${index}`} className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden bg-peach-light">
                      <ProductImage product={item} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-black">{item.name}</p>
                      <p className="mt-1 text-xs text-black/60">{item.weight} · Qty {item.quantity}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-black">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between gap-4 pt-4 text-base font-bold text-black">
                <span>Order total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <p className="mt-2 text-xs text-black/60">Delivery cost will be confirmed by our team.</p>
            </section>

            {order.customer && (
              <section aria-labelledby="delivery-details-title" className="border border-peach-mid/50 bg-white p-4 shadow-sm sm:p-6">
                <h2 id="delivery-details-title" className="mb-4 font-bold text-black">Delivery details</h2>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-black/60">Contact</dt>
                    <dd className="mt-1 font-medium text-black">{order.customer.name}</dd>
                    {order.customer.business_name && <dd className="text-black/80">{order.customer.business_name}</dd>}
                    <dd className="break-all text-black/80">{order.customer.email}</dd>
                    {order.customer.phone && <dd className="text-black/80">{order.customer.phone}</dd>}
                  </div>
                  {(order.customer.address || order.customer.city) && (
                    <div>
                      <dt className="text-xs text-black/60">Delivery address</dt>
                      <dd className="mt-1 font-medium text-black">{order.customer.address}</dd>
                      <dd className="text-black/80">{order.customer.city}</dd>
                    </div>
                  )}
                  {order.customer.notes && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-black/60">Delivery notes</dt>
                      <dd className="mt-1 text-black/80">{order.customer.notes}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}
          </div>

          <aside className="h-fit border border-peach-mid/50 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 font-bold text-black">What happens next?</h2>
            <ol className="space-y-5">
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f3e9] text-[#28713b]">
                  <LuCheck aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-black">Request received</p>
                  <p className="mt-1 text-xs leading-relaxed text-black/60">Your order is safely with our team.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach-light text-primary">
                  <LuCoffee aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-black">We’ll get in touch</p>
                  <p className="mt-1 text-xs leading-relaxed text-black/60">
                    {order.customer?.email ? `We’ll contact you at ${order.customer.email} ` : 'Our team will contact you '}
                    to confirm availability and delivery.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach-light text-primary">
                  <LuPackageCheck aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-black">Delivery and payment</p>
                  <p className="mt-1 text-xs leading-relaxed text-black/60">We’ll agree on the details with you before delivery.</p>
                </div>
              </li>
            </ol>
            <p className="mt-5 border-t border-peach-mid/40 pt-4 text-xs leading-relaxed text-black/60">
              No online payment has been collected. This is an order request, not a completed payment.
            </p>
          </aside>
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/#products" className="inline-flex items-center justify-center gap-2 bg-[#F58537] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#e8742b]">
            Continue shopping <LuArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link to="/" className="inline-flex items-center justify-center border border-black/20 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-peach-light">
            Back to home
          </Link>
        </div>
      </div>
    </section>
  )
}
