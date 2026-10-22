import { Link } from 'react-router-dom'
import { LuArrowLeft, LuMinus, LuPlus, LuShoppingBag, LuTrash2 } from 'react-icons/lu'
import { formatPrice } from '../data/products.js'
import { useCart } from '../context/useCart.js'
import ProductImage from '../components/ProductImage.jsx'

export default function CartPage() {
  const { items, cartTotal, updateQuantity, removeFromCart } = useCart()
  const cartCount = items.reduce((total, item) => total + item.quantity, 0)

  if (items.length === 0) {
    return (
      <section className="bg-[#fffdfa] px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-xl rounded-2xl border border-peach-mid/50 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-peach-light text-primary">
            <LuShoppingBag aria-hidden="true" className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-brown sm:text-3xl">Your cart is empty</h1>
          <p className="mb-6 text-sm leading-relaxed text-brown/70">Find your next favorite cup in our coffee shop.</p>
          <Link to="/" className="inline-flex items-center justify-center gap-2 bg-[#F58537] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e8742b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Browse coffee
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[#fffdfa] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3 sm:mb-9">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">Your coffee selection</p>
            <h1 className="text-3xl font-bold tracking-tight text-brown sm:text-4xl">Shopping cart</h1>
          </div>
          <p className="text-sm text-brown/65">{cartCount} {cartCount === 1 ? 'item' : 'items'}</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
          <div className="space-y-3">
            {items.map(item => (
              <article key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 border border-peach-mid/50 bg-white p-3 shadow-sm sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-4 sm:p-4 md:grid-cols-[88px_minmax(0,1fr)_auto_auto_auto] md:gap-5">
                <Link to={`/products/${item.id}`} className="row-span-2 aspect-square overflow-hidden bg-peach-light md:row-span-1" aria-label={`View ${item.name}`}>
                  <ProductImage product={item} className="transition-transform duration-300 hover:scale-105" />
                </Link>
                <div className="min-w-0">
                  <Link to={`/products/${item.id}`} className="font-bold leading-snug text-brown transition-colors hover:text-primary">{item.name}</Link>
                  <p className="mt-1 text-xs text-brown/65">{item.weight} · {formatPrice(item.price)} each</p>
                </div>
                <div className="col-start-2 flex min-w-0 items-center justify-between gap-2 sm:gap-3 md:col-start-auto md:contents">
                  <div className="inline-flex h-9 items-center border border-black">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.name}`}
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="flex h-full w-9 items-center justify-center bg-black text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <LuMinus aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                    <label className="sr-only" htmlFor={`quantity-${item.id}`}>Quantity of {item.name}</label>
                    <input
                      id={`quantity-${item.id}`}
                      type="number"
                      min="1"
                      max="99"
                      value={item.quantity}
                      onChange={event => updateQuantity(item.id, Math.max(1, Math.min(99, Number(event.target.value) || 1)))}
                      className="h-full w-10 border-x border-black text-center text-sm font-semibold text-brown outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.name}`}
                      disabled={item.quantity >= 99}
                      onClick={() => updateQuantity(item.id, Math.min(99, item.quantity + 1))}
                      className="flex h-full w-9 items-center justify-center bg-black text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <LuPlus aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="shrink-0 text-xs font-bold text-brown sm:text-sm">{formatPrice(item.price * item.quantity)}</p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-red-700 transition-colors hover:text-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:gap-1.5"
                  >
                    <LuTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </article>
            ))}
            <Link to="/#products" className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-brown transition-colors hover:text-primary">
              <LuArrowLeft aria-hidden="true" className="h-4 w-4" />
              Continue shopping
            </Link>
          </div>

          <aside className="border border-peach-mid/50 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-bold text-brown">Order summary</h2>
            <div className="mt-5 flex justify-between gap-4 border-t border-peach-mid/50 pt-4 text-sm text-brown">
              <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
              <span className="font-semibold">{formatPrice(cartTotal)}</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-brown/65">Delivery costs, if applicable, will be confirmed by our team.</p>
            <div className="mt-5 flex justify-between border-t border-peach-mid/50 pt-4 font-bold text-brown">
              <span>Total</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <Link to="/checkout" className="mt-5 block bg-[#F58537] px-5 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#e8742b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Continue to checkout
            </Link>
            <p className="mt-3 text-center text-xs text-brown/60">No payment is collected online.</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
