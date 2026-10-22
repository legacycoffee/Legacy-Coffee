import { useState } from 'react'
import { Link } from 'react-router-dom'
import { products, formatPrice } from '../data/products.js'
import { useCart } from '../context/useCart.js'
import ProductImage from '../components/ProductImage.jsx'

export default function Shop() {
  const { addToCart } = useCart()
  const [form, setForm] = useState({ name: '', email: '', product: products[0]?.name ?? '', quantity: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [addedProduct, setAddedProduct] = useState('')

  const handleSubmit = event => {
    event.preventDefault()
    setSubmitted(true)
  }

  const handleAddToCart = product => {
    addToCart(product)
    setAddedProduct(product.id)
    window.setTimeout(() => setAddedProduct(''), 1800)
  }

  return (
    <div className="bg-[#fffdfa]">
      <section className="relative isolate h-screen min-h-[600px] overflow-hidden bg-[#21160e] text-white">
        <img
          src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=2000&auto=format&fit=crop&q=85"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(18,23,15,0.96) 0%, rgba(35,25,16,0.84) 42%, rgba(55,32,17,0.42) 72%, rgba(30,18,9,0.24) 100%), linear-gradient(0deg, rgba(25,15,8,0.5), transparent 40%)',
          }}
        />
        <div aria-hidden="true" className="absolute -right-32 -top-48 hidden h-[780px] w-[420px] rotate-[28deg] bg-white/[0.06] md:block" />
        <div aria-hidden="true" className="absolute -right-24 top-16 hidden h-[660px] w-[2px] rotate-[28deg] bg-primary/70 md:block" />
        <div aria-hidden="true" className="absolute -right-[34rem] top-24 hidden h-[760px] w-[760px] rounded-full border-2 border-primary md:block" />
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-36 w-[min(26vw,400px)] text-primary"
          viewBox="0 0 480 144"
          preserveAspectRatio="none"
          fill="none"
        >
          <path d="M0 0C115 48 234 53 480 144H0V0Z" fill="currentColor" fillOpacity="0.85" />
          <path d="M0 10C112 63 242 71 355 144" stroke="currentColor" strokeWidth="2" />
        </svg>

        <div className="relative z-10 mx-auto flex h-full min-h-[600px] max-w-7xl items-center px-6 pb-12 pt-28 md:px-10 md:pb-16 md:pt-28 lg:px-12">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-primary md:mb-4 md:text-sm">
              Legacy Coffee
            </p>
            <h1
              className="mb-5 max-w-3xl text-5xl font-black leading-[0.98] text-white sm:text-6xl lg:text-7xl"
            >
              Bringing the Best Out
              <br />
              <span className="text-primary">of Every Bean</span>
            </h1>
            <p className="mb-8 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
              From cafés to busy restaurants and homes, we bring you fresh, rich coffee that makes every cup memorable.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-5">
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                About Us
              </Link>
              <Link
                to="/partner"
                className="inline-flex items-center justify-center rounded-full border border-peach-light/80 px-7 py-3.5 text-sm font-semibold text-peach-light transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Partner With Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="bg-[#fffdfa] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
            <div>
              <h2 className="text-2xl font-bold text-brown sm:text-3xl">Order your favorite coffee</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {products.map(product => (
              <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-peach-mid/40 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <Link to={`/products/${product.id}`} aria-label={`View ${product.name}`} className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary">
                  <div className="relative block aspect-[4/3] w-full overflow-hidden bg-peach-light">
                    <ProductImage product={product} className="transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-brown shadow-sm sm:left-3 sm:top-3 sm:text-xs">
                      {product.weight}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-3 sm:p-4 lg:p-5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary sm:text-xs">{product.roast}</p>
                    <p className="mb-2 text-sm font-bold leading-snug text-brown group-hover:text-primary sm:text-base lg:text-lg">{product.name}</p>
                    <p className="mb-4 flex-1 text-xs leading-relaxed text-brown/70 sm:text-sm">{product.description}</p>
                    <p className="mt-auto text-lg font-bold text-brown sm:text-xl">{formatPrice(product.price)}</p>
                  </div>
                </Link>
                <div className="px-3 pb-3 sm:px-4 sm:pb-4 lg:px-5 lg:pb-5">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className="w-full rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-sm"
                  >
                    {addedProduct === product.id ? 'Added!' : 'Add to cart'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="quote" className="bg-peach-light px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-primary">For your business</p>
          <h2 className="mb-2 text-center text-3xl font-bold text-brown">Need a larger order?</h2>
          <p className="mb-8 text-center text-sm leading-relaxed text-brown/75">Request a tailored quote.</p>

          {submitted ? (
            <div className="rounded-xl bg-white p-8 text-center">
              <div className="mb-4 text-5xl">✅</div>
              <h3 className="mb-2 text-xl font-bold text-primary">Quote Request Sent!</h3>
              <p className="text-sm text-brown">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-peach-mid/40 bg-white p-5 shadow-sm sm:p-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input required placeholder="Your Name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}
                  className="rounded border border-peach-mid px-4 py-2 text-sm text-brown outline-none focus:border-primary" />
                <input required type="email" placeholder="Email Address" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })}
                  className="rounded border border-peach-mid px-4 py-2 text-sm text-brown outline-none focus:border-primary" />
              </div>
              <select required value={form.product} onChange={event => setForm({ ...form, product: event.target.value })}
                className="w-full rounded border border-peach-mid px-4 py-2 text-sm text-brown outline-none focus:border-primary">
                {products.slice(0, 2).map(product => <option key={product.id} value={product.name}>{product.name}</option>)}
              </select>
              <input required placeholder="Quantity (e.g. 50kg)" value={form.quantity} onChange={event => setForm({ ...form, quantity: event.target.value })}
                className="w-full rounded border border-peach-mid px-4 py-2 text-sm text-brown outline-none focus:border-primary" />
              <textarea rows={4} placeholder="Additional message..." value={form.message} onChange={event => setForm({ ...form, message: event.target.value })}
                className="w-full resize-none rounded border border-peach-mid px-4 py-2 text-sm text-brown outline-none focus:border-primary" />
              <button type="submit" className="w-full rounded bg-primary py-3 font-semibold text-white transition-opacity hover:opacity-90">
                Submit Quote Request
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
