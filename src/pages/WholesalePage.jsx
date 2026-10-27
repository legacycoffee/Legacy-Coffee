import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../context/api.js'
import { useCart } from '../context/useCart.js'
import ProductImage from '../components/ProductImage.jsx'
import { formatPrice, products } from '../data/products.js'

const inputClass = 'mt-1.5 w-full border border-peach-mid bg-white px-3.5 py-3 text-sm text-black outline-none transition-colors placeholder:text-black/40 focus:border-primary focus:ring-2 focus:ring-primary/20'
const labelClass = 'block text-sm font-medium text-black'

export default function WholesalePage() {
  const navigate = useNavigate()
  const { items, addWholesaleItems } = useCart()
  const [contactDetails, setContactDetails] = useState({
    name: '',
    business_name: '',
  })
  const [quantities, setQuantities] = useState({})
  const [wholesalePrices, setWholesalePrices] = useState({})
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let isCurrent = true
    apiRequest('/shop/products/')
      .then(data => {
        if (isCurrent) {
          setWholesalePrices(Object.fromEntries(
            data.results.map(product => [product.id, product.wholesale_price]),
          ))
        }
      })
      .catch(() => {})

    return () => {
      isCurrent = false
    }
  }, [])

  const selectedProducts = products.filter(product => quantities[product.id] !== undefined)
  const getUnitPrice = product => wholesalePrices[product.id] ?? product.price
  const hasWholesalePrice = product => wholesalePrices[product.id] != null
  const estimatedTotal = selectedProducts.reduce(
    (total, product) => total + getUnitPrice(product) * (Number(quantities[product.id]) || 0),
    0,
  )

  const handleChange = event => {
    setContactDetails(current => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleProductToggle = (productId, isSelected) => {
    setQuantities(current => {
      const next = { ...current }
      if (isSelected) {
        next[productId] = '1'
      } else {
        delete next[productId]
      }
      return next
    })
  }

  const handleOrderNow = event => {
    event.preventDefault()
    setSubmitError('')
    if (selectedProducts.length === 0) {
      setSubmitError('Select at least one coffee product and enter its quantity.')
      return
    }
    if (selectedProducts.some(product => (
      !Number.isInteger(Number(quantities[product.id]))
      || Number(quantities[product.id]) < 1
      || Number(quantities[product.id]) > 99
    ))) {
      setSubmitError('Enter a whole-number quantity from 1 to 99 for each selected product.')
      return
    }
    if (selectedProducts.some(product => {
      const currentQuantity = items.find(item => item.id === product.id)?.quantity || 0
      return currentQuantity + Number(quantities[product.id]) > 99
    })) {
      setSubmitError('The cart limit is 99 units per product. Reduce the selected quantity or update the cart first.')
      return
    }

    addWholesaleItems(
      selectedProducts.map(product => ({
        ...product,
        price: getUnitPrice(product),
        quantity: Number(quantities[product.id]),
        is_wholesale: true,
      })),
      contactDetails,
    )
    navigate('/cart')
  }

  return (
    <div className="bg-[#fffdfa]">
      <section className="bg-brown px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">Buy in wholesale</h1>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <form onSubmit={handleOrderNow} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(product => (
                <article
                  key={product.id}
                  className={`border bg-white p-3 transition-colors sm:p-4 ${
                    quantities[product.id] !== undefined ? 'border-primary ring-1 ring-primary' : 'border-peach-mid/50'
                  }`}
                >
                  <label className="grid cursor-pointer grid-cols-[88px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[104px_minmax(0,1fr)]">
                    <span className="flex aspect-square items-center justify-center bg-white p-2">
                      <ProductImage product={product} objectFit="contain" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-[10px] font-bold uppercase tracking-wide text-primary">{product.roast}</span>
                          <span className="mt-1 block truncate text-sm font-bold text-brown sm:text-base">{product.name}</span>
                          <span className="mt-1 block text-xs text-brown/65">{product.weight}</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={quantities[product.id] !== undefined}
                          onChange={event => handleProductToggle(product.id, event.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                          aria-label={`Select ${product.name} for wholesale`}
                        />
                      </span>
                      <span className="mt-2 block text-sm font-semibold text-brown">
                        {formatPrice(getUnitPrice(product))} <span className="text-xs font-normal text-brown/65">per unit</span>
                      </span>
                      <span className="mt-0.5 block text-[10px] text-brown/60">
                        {hasWholesalePrice(product) ? 'Wholesale price' : 'Retail estimate'}
                      </span>
                    </span>
                  </label>
                  {quantities[product.id] !== undefined && (
                    <label htmlFor={`wholesale-quantity-${product.id}`} className={`${labelClass} mt-3 block`}>
                      Quantity ({product.weight})
                      <input
                        id={`wholesale-quantity-${product.id}`}
                        type="number"
                        min="1"
                        max="99"
                        step="1"
                        required
                        value={quantities[product.id]}
                        onChange={event => setQuantities(current => ({
                          ...current,
                          [product.id]: event.target.value,
                        }))}
                        className={inputClass}
                      />
                      <span className="mt-1 block text-xs font-semibold text-brown">
                        Estimated line total: {formatPrice(getUnitPrice(product) * (Number(quantities[product.id]) || 0))}
                      </span>
                    </label>
                  )}
                </article>
              ))}
            </div>
            <div className="grid gap-4 border border-peach-mid/50 bg-white p-4 sm:grid-cols-2 sm:p-5">
              <label htmlFor="wholesale-name" className={labelClass}>
                Name <span className="font-normal text-black/55">(optional)</span>
                <input id="wholesale-name" name="name" autoComplete="name" value={contactDetails.name} onChange={handleChange} placeholder="Your name" className={inputClass} />
              </label>
              <label htmlFor="wholesale-business" className={labelClass}>
                Business name <span className="font-normal text-black/55">(optional)</span>
                <input id="wholesale-business" name="business_name" autoComplete="organization" value={contactDetails.business_name} onChange={handleChange} placeholder="Your café or business" className={inputClass} />
              </label>
            </div>
            <div className="flex flex-col items-start justify-between gap-4 border-t border-peach-mid/50 pt-5 sm:flex-row sm:items-center">
              <p className="text-sm text-brown">
                Estimated total: <strong className="text-base">{formatPrice(estimatedTotal)}</strong>
                <span className="mt-1 block text-xs text-brown/65">Final pricing and delivery will be confirmed by our team.</span>
              </p>
              <button type="submit" disabled={!selectedProducts.length} className="w-full bg-primary px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                Order now
              </button>
            </div>
            {submitError && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</p>}
          </form>
        </div>
      </section>
    </div>
  )
}
