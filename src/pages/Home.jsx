import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { products, formatPrice } from '../data/products.js'
import { useCart } from '../context/useCart.js'
import { apiRequest } from '../context/api.js'
import ProductImage from '../components/ProductImage.jsx'

const quoteInputClass = 'mt-1.5 w-full border border-peach-mid bg-white px-3.5 py-3 text-sm text-black outline-none transition-colors placeholder:text-black/40 focus:border-primary focus:ring-2 focus:ring-primary/20'
const quoteLabelClass = 'block text-sm font-medium text-black'

const heroImages = [
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=2000&auto=format&fit=crop&q=85',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1792742178/back_1.png',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1792742178/coffee_cup.png',
]

export default function Home() {
  const { addToCart } = useCart()
  const [form, setForm] = useState({ name: '', email: '', phone: '', product: products[0]?.name ?? '', quantity: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submittedRequest, setSubmittedRequest] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addedProduct, setAddedProduct] = useState('')
  const [currentHeroImage, setCurrentHeroImage] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentHeroImage(current => (current + 1) % heroImages.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

  const handleSubmit = async event => {
    event.preventDefault()
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const result = await apiRequest('/inquiries/', {
        method: 'POST',
        body: {
          kind: 'quote',
          name: form.name,
          email: form.email,
          phone: form.phone,
          product: form.product,
          quantity: form.quantity,
          subject: `Quote request for ${form.product}`,
          message: form.message || `Please provide a tailored quote for ${form.quantity} of ${form.product}.`,
        },
      })
      setSubmittedRequest(result)
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormChange = event => {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleAddToCart = product => {
    addToCart(product)
    setAddedProduct(product.id)
    window.setTimeout(() => setAddedProduct(''), 1800)
  }

  return (
    <div className="bg-[#fffdfa]">
      <section className="relative isolate h-screen min-h-[600px] overflow-hidden bg-[#21160e] text-white">
        {heroImages.map((image, index) => (
          <img
            key={image}
            src={image}
            alt=""
            aria-hidden="true"
            className={`hero-slide-image absolute inset-0 h-full w-full object-cover object-center md:object-[62%_center] transition-opacity duration-1000 ease-in-out ${index === currentHeroImage ? 'hero-slide-active z-[1] opacity-100' : 'z-0 opacity-0'}`}
          />
        ))}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[2]"
          style={{
            background:
              'linear-gradient(90deg, rgba(18,23,15,0.94) 0%, rgba(35,25,16,0.76) 38%, rgba(55,32,17,0.28) 72%, rgba(30,18,9,0.12) 100%), linear-gradient(0deg, rgba(25,15,8,0.76), transparent 48%), linear-gradient(180deg, rgba(25,15,8,0.22), transparent 32%)',
          }}
        />
        <div aria-hidden="true" className="absolute -right-32 -top-48 z-[3] hidden h-[780px] w-[420px] rotate-[28deg] bg-white/[0.06] md:block" />
        <div aria-hidden="true" className="absolute -right-24 top-16 z-[3] hidden h-[660px] w-[2px] rotate-[28deg] bg-primary/70 md:block" />
        <div aria-hidden="true" className="absolute -right-[34rem] top-24 z-[3] hidden h-[760px] w-[760px] rounded-full border-2 border-primary md:block" />
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 z-[3] h-36 w-[min(26vw,400px)] text-primary"
          viewBox="0 0 480 144"
          preserveAspectRatio="none"
          fill="none"
        >
          <path d="M0 0C115 48 234 53 480 144H0V0Z" fill="currentColor" fillOpacity="0.85" />
          <path d="M0 10C112 63 242 71 355 144" stroke="currentColor" strokeWidth="2" />
        </svg>

        <div className="relative z-10 mx-auto flex h-full min-h-[600px] max-w-7xl items-center px-6 pb-28 pt-28 md:px-10 md:pb-16 md:pt-28 lg:px-12">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-primary sm:text-base md:mb-4 md:text-lg">
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

      <section id="quote" className="relative overflow-hidden bg-[#f8eee3] px-4 py-14 sm:px-6 sm:py-20">
        <div aria-hidden="true" className="absolute -right-24 -top-28 h-80 w-80 rounded-full border-[36px] border-primary/10" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div className="max-w-lg">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">For your business</p>
              <h2 className="text-3xl font-bold leading-tight text-brown sm:text-4xl">Need a larger order?</h2>
              <p className="mt-3 text-base leading-relaxed text-brown/75">
                Tell us what you need and we’ll prepare a tailored quote for your business.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-brown/80">
                <li className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">✓</span>
                  Bulk coffee for cafés, restaurants, hotels, and teams
                </li>
                <li className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">✓</span>
                  Product and quantity options to fit your needs
                </li>
                <li className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">✓</span>
                  Our team will follow up to discuss the details
                </li>
              </ul>
            </div>

          {submitted ? (
            <div role="status" className="border border-peach-mid/50 bg-white p-6 shadow-sm sm:p-9">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-800">✓</div>
              <h3 className="text-xl font-bold text-brown">Your quote request is in</h3>
              <p className="mt-2 text-sm leading-relaxed text-brown/75">
                Thanks, {submittedRequest?.name}. Our team will contact you at {submittedRequest?.email} to discuss your request.
              </p>
              {submittedRequest?.id && <p className="mt-4 text-xs text-brown/60">Request reference: #{submittedRequest.id}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 border border-peach-mid/50 bg-white p-5 shadow-sm sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <label htmlFor="quote-name" className={quoteLabelClass}>
                  Your name
                  <input id="quote-name" name="name" autoComplete="name" required value={form.name} onChange={handleFormChange} placeholder="e.g. Alex Namusoke" className={quoteInputClass} />
                </label>
                <label htmlFor="quote-email" className={quoteLabelClass}>
                  Email address
                  <input id="quote-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleFormChange} placeholder="you@example.com" className={quoteInputClass} />
                </label>
                <label htmlFor="quote-phone" className={quoteLabelClass}>
                  Phone number <span className="font-normal text-black/55">(optional)</span>
                  <input id="quote-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleFormChange} placeholder="+256 700 000 000" className={quoteInputClass} />
                </label>
                <label htmlFor="quote-product" className={quoteLabelClass}>
                  Coffee product
                  <select id="quote-product" name="product" required value={form.product} onChange={handleFormChange} className={quoteInputClass}>
                    {products.map(product => <option key={product.id} value={product.name}>{product.name} · {product.weight}</option>)}
                  </select>
                </label>
                <label htmlFor="quote-quantity" className={`${quoteLabelClass} sm:col-span-2`}>
                  Quantity needed
                  <input id="quote-quantity" name="quantity" required value={form.quantity} onChange={handleFormChange} placeholder="e.g. 50 bags or 100 kg" className={quoteInputClass} />
                </label>
                <label htmlFor="quote-message" className={`${quoteLabelClass} sm:col-span-2`}>
                  Tell us a little more <span className="font-normal text-black/55">(optional)</span>
                  <textarea id="quote-message" name="message" rows={4} value={form.message} onChange={handleFormChange} placeholder="Share your business needs, delivery location, or any questions." className={`${quoteInputClass} resize-y`} />
                </label>
              </div>
              {submitError && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#F58537] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#e8742b] disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                {isSubmitting ? 'Sending request…' : 'Request my quote'}
              </button>
            </form>
          )}
          </div>
        </div>
      </section>
    </div>
  )
}
