import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowRight, LuCoffee } from 'react-icons/lu'
import { apiRequest } from '../context/api.js'
import ProductImage from '../components/ProductImage.jsx'
import { products } from '../data/products.js'

const inputClass = 'mt-1.5 w-full border border-peach-mid bg-white px-3.5 py-3 text-sm text-black outline-none transition-colors placeholder:text-black/40 focus:border-primary focus:ring-2 focus:ring-primary/20'
const labelClass = 'block text-sm font-medium text-black'

export default function WholesalePage() {
  const [form, setForm] = useState({
    name: '',
    business_name: '',
    email: '',
    phone: '',
    product: products[0]?.id ?? '',
    quantity: '',
    message: '',
  })
  const [submittedRequest, setSubmittedRequest] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedProduct = products.find(product => product.id === form.product)

  const handleChange = event => {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setSubmitError('')
    setIsSubmitting(true)

    try {
      const request = await apiRequest('/inquiries/', {
        method: 'POST',
        body: {
          kind: 'quote',
          name: form.name,
          business_name: form.business_name,
          email: form.email,
          phone: form.phone,
          product: selectedProduct.name,
          quantity: form.quantity,
          subject: `Wholesale request for ${selectedProduct.name}`,
          message: form.message || `Please provide wholesale pricing for ${form.quantity} of ${selectedProduct.name}.`,
        },
      })
      setSubmittedRequest(request)
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-[#fffdfa]">
      <section className="bg-brown px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary sm:text-sm">For cafés, hotels, and businesses</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">Buy Legacy Coffee wholesale</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Bring the rich taste of Ugandan coffee to your customers. Tell us what you need and our team will prepare a wholesale quote for your business.
          </p>
          <a
            href="#wholesale-request"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Request wholesale pricing <LuArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Our coffee</p>
            <h2 className="mt-1 text-2xl font-bold text-brown sm:text-3xl">Choose coffee for your business</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brown/70">
              Select a product below to include it in your quote request. We’ll confirm bulk pricing and availability with you directly.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(product => (
              <button
                key={product.id}
                type="button"
                onClick={() => setForm(current => ({ ...current, product: product.id }))}
                aria-pressed={form.product === product.id}
                className={`grid grid-cols-[88px_minmax(0,1fr)] items-center gap-4 border bg-white p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:grid-cols-[104px_minmax(0,1fr)] sm:p-4 ${
                  form.product === product.id ? 'border-primary ring-1 ring-primary' : 'border-peach-mid/50 hover:border-primary/60'
                }`}
              >
                <span className="flex aspect-square items-center justify-center bg-peach-light p-2">
                  <ProductImage product={product} objectFit="contain" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-primary">{product.roast}</span>
                  <span className="mt-1 block truncate text-sm font-bold text-brown sm:text-base">{product.name}</span>
                  <span className="mt-1 block text-xs text-brown/65">{product.weight}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brown">
                    {form.product === product.id ? 'Selected for quote' : 'Select this coffee'}
                    <LuCoffee aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="wholesale-request" className="bg-[#f8eee3] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Let’s work together</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight text-brown sm:text-4xl">Get a wholesale quote</h2>
            <p className="mt-3 text-sm leading-relaxed text-brown/75 sm:text-base">
              Share a few details about your order. Our team will follow up to discuss volume, availability, and delivery.
            </p>
            <div className="mt-6 border-l-2 border-primary pl-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brown/65">Selected product</p>
              <p className="mt-1 font-bold text-brown">{selectedProduct?.name}</p>
              <p className="text-sm text-brown/70">{selectedProduct?.weight}</p>
            </div>
            <Link to="/contact" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark">
              Have another question? Contact us <LuArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          {submittedRequest ? (
            <div role="status" className="border border-peach-mid/50 bg-white p-6 shadow-sm sm:p-9">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-peach-light text-xl font-bold text-primary">✓</div>
              <h3 className="text-xl font-bold text-brown">Wholesale request received</h3>
              <p className="mt-2 text-sm leading-relaxed text-brown/75">
                Thanks, {submittedRequest.name}. Our team will contact you at {submittedRequest.email} to discuss your quote.
              </p>
              {submittedRequest.id && <p className="mt-4 text-xs text-brown/60">Request reference: #{submittedRequest.id}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 border border-peach-mid/50 bg-white p-5 shadow-sm sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <label htmlFor="wholesale-name" className={labelClass}>
                  Your name
                  <input id="wholesale-name" name="name" autoComplete="name" required value={form.name} onChange={handleChange} placeholder="e.g. Alex Namusoke" className={inputClass} />
                </label>
                <label htmlFor="wholesale-business" className={labelClass}>
                  Business name <span className="font-normal text-black/55">(optional)</span>
                  <input id="wholesale-business" name="business_name" autoComplete="organization" value={form.business_name} onChange={handleChange} placeholder="Your café or business" className={inputClass} />
                </label>
                <label htmlFor="wholesale-email" className={labelClass}>
                  Email address
                  <input id="wholesale-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
                </label>
                <label htmlFor="wholesale-phone" className={labelClass}>
                  Phone number <span className="font-normal text-black/55">(optional)</span>
                  <input id="wholesale-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleChange} placeholder="+256 700 000 000" className={inputClass} />
                </label>
                <label htmlFor="wholesale-product" className={labelClass}>
                  Coffee product
                  <select id="wholesale-product" name="product" required value={form.product} onChange={handleChange} className={inputClass}>
                    {products.map(product => <option key={product.id} value={product.id}>{product.name} · {product.weight}</option>)}
                  </select>
                </label>
                <label htmlFor="wholesale-quantity" className={labelClass}>
                  Quantity needed
                  <input id="wholesale-quantity" name="quantity" required value={form.quantity} onChange={handleChange} placeholder="e.g. 50 bags or 100 kg" className={inputClass} />
                </label>
                <label htmlFor="wholesale-message" className={`${labelClass} sm:col-span-2`}>
                  Additional details <span className="font-normal text-black/55">(optional)</span>
                  <textarea id="wholesale-message" name="message" rows={4} value={form.message} onChange={handleChange} placeholder="Tell us about your business, delivery location, or any questions." className={`${inputClass} resize-y`} />
                </label>
              </div>
              {submitError && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full bg-primary px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                {isSubmitting ? 'Sending request…' : 'Request wholesale quote'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
