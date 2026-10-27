import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products.js'
import { useCart } from '../context/useCart.js'
import ProductImage from '../components/ProductImage.jsx'
import useProducts from '../hooks/useProducts.js'

const heroImages = [
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=2000&auto=format&fit=crop&q=85',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1792742178/back_1.png',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1792742178/coffee_cup.png',
]

export default function Home() {
  const { addToCart } = useCart()
  const { products, isLoading: isProductsLoading, error: productsError } = useProducts()
  const [addedProduct, setAddedProduct] = useState('')
  const [currentHeroImage, setCurrentHeroImage] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentHeroImage(current => (current + 1) % heroImages.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

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
          {isProductsLoading ? (
                <p role="status" className="text-sm text-brown/70">Loading products…</p>
          ) : productsError ? (
                <p role="alert" className="mb-5 text-sm text-red-700">Could not load products: {productsError}</p>
          ) : products.length === 0 ? (
                <p className="text-sm text-brown/70">No products are currently available.</p>
          ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
                  {products.map(product => (
                    <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-peach-mid/40 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <Link to={`/products/${product.id}`} aria-label={`View ${product.name}`} className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary">
                        <div className="relative block aspect-[4/3] w-full overflow-hidden bg-peach-light">
                          <ProductImage product={product} className="transition-transform duration-500 sm:group-hover:scale-105" />
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
          )}
        </div>
      </section>

      <section id="quote" className="bg-[#f8eee3] px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto flex max-w-7xl justify-center">
          <Link
            to="/wholesale"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Buy wholesale
          </Link>
        </div>
      </section>
    </div>
  )
}
