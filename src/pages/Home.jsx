import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatProductPrice } from '../data/products.js'
import { useCart } from '../context/useCart.js'
import ProductImage from '../components/ProductImage.jsx'
import useProducts from '../hooks/useProducts.js'
import { getProductUrl } from '../utils/productUrl.js'

const heroImages = [
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&auto=format&fit=crop&q=75',
  'https://res.cloudinary.com/vgko5mna/image/upload/f_auto,q_auto,w_1600/v1792742178/back_1.png',
  'https://res.cloudinary.com/vgko5mna/image/upload/f_auto,q_auto,w_1600/v1792742178/coffee_cup.png',
]

function OurCoffeeSection() {
  return (
    <section className="bg-[#f8eee3] px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl text-brown">
        <article className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-8 rounded-2xl border border-peach-mid/60 bg-white p-7 text-center shadow-sm md:mt-14 md:p-9">
          <div className="flex w-full flex-col items-center">
            <h2 className="mb-6 text-4xl font-black leading-tight text-primary md:text-5xl">
              Our Coffee
            </h2>
            <p className="w-full max-w-4xl text-center text-sm font-normal leading-relaxed text-brown/80">
              Uganda’s rich soils and high-altitude climate create the perfect conditions for exceptional coffee. Legacy Coffee sources directly from smallholder farmers in Kyenjojo, Kabarole, Bunyangabu and surrounding areas, ensuring freshness, traceability, and quality.
            </p>
          </div>
          <div className="flex w-full flex-col items-center">
            <h3 className="mb-3 text-xl font-bold text-primary md:text-2xl">Processing &amp; Roasting</h3>
            <p className="w-full max-w-2xl text-center text-sm font-normal leading-relaxed text-brown/80">
              From hand-picking ripe cherries to careful washing, drying, and roasting, our process preserves natural flavors and guarantees consistency.
            </p>
          </div>
          <div className="flex w-full flex-col items-center">
            <h3 className="mb-3 text-xl font-bold text-primary md:text-2xl">Flavor Notes</h3>
            <p className="w-full max-w-2xl text-center text-sm font-normal leading-relaxed text-brown/80">
              Rich, smooth body with hints of chocolate, nutty undertones, and a bright, clean finish
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}

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
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'low'}
            decoding="async"
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

        <div className="relative z-10 mx-auto flex h-full min-h-[600px] max-w-7xl items-center justify-center px-6 pb-28 pt-28 text-center md:px-10 md:pb-16 md:pt-28 lg:px-12">
          <div className="mx-auto w-full max-w-3xl">
            <p className="mb-3 text-center text-sm font-bold uppercase tracking-[0.25em] text-primary sm:text-base md:mb-4 md:text-lg">
              Legacy Coffee
            </p>
            <h1
              className="mx-auto mb-5 max-w-3xl text-balance text-center text-5xl font-black leading-[0.98] text-white sm:text-6xl lg:text-7xl"
            >
              Bringing the Best <span className="whitespace-nowrap">Out of</span>{' '}
              <span className="text-primary">Every Bean</span>
            </h1>
            <p className="mx-auto mb-8 max-w-lg text-balance text-center text-base leading-relaxed text-white/80 sm:text-lg">
              From cafés to busy restaurants and homes, Legacy Coffee brings you quality Ugandan coffee, freshly roasted for rich flavour and memorable experiences.
            </p>
            <div className="mx-auto flex w-full max-w-xs flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-5">
              <Link
                to="/#product-list"
                className="inline-flex w-full items-center justify-center rounded-full bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/40 transition-all duration-300 hover:bg-white hover:text-brown sm:w-auto md:px-9 md:py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Shop Coffee →
              </Link>
              <Link
                to="/about#partnership"
                className="inline-flex w-full items-center justify-center rounded-full border-2 border-white/50 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-all duration-300 hover:border-primary hover:text-primary sm:w-auto md:px-9 md:py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Partner With Us
              </Link>
            </div>
          </div>
        </div>

      </section>

      <section id="products" className="bg-[#fffdfa] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex justify-center gap-4 text-center sm:mb-9">
            <div>
              <h2 className="text-2xl font-bold text-brown sm:text-3xl">Order your favorite coffee</h2>
            </div>
          </div>
          {isProductsLoading && products.length === 0 ? (
            <p role="status" className="text-center text-sm text-brown/70">Loading products…</p>
          ) : productsError && products.length === 0 ? (
            <p role="alert" className="mb-5 text-center text-sm text-red-700">Could not load products: {productsError}</p>
          ) : products.length === 0 ? (
            <p className="text-center text-sm text-brown/70">No products are currently available.</p>
          ) : (
            <>
              {isProductsLoading && <p role="status" className="mb-4 text-center text-xs text-brown/60">Loading the latest catalog…</p>}
              <div id="product-list" className="grid scroll-mt-24 grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
                {products.map(product => (
                  <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-peach-mid/40 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <Link to={getProductUrl(product)} aria-label={`View ${product.name}`} className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary">
                    <div className="relative block aspect-[4/3] w-full overflow-hidden bg-peach-light">
                      <ProductImage
                        product={product.id === 'coffee-seedlings'
                          ? {
                              ...product,
                              image: 'https://res.cloudinary.com/vgko5mna/image/upload/v1793967783/coffee_seedling.jpg',
                              imageAlt: 'Coffee seedlings growing at the farm',
                            }
                          : product}
                        className={`transition-transform duration-500 sm:group-hover:scale-105 ${
                          product.id === 'coffee-seedlings' ? 'object-[center_50%]' : ''
                        }`}
                      />
                      <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-brown shadow-sm sm:right-3 sm:top-3 sm:text-xs">
                        {product.id === 'coffee-seedlings' ? 'Seedling' : product.weight}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col items-center p-3 text-center sm:p-4 lg:p-5">
                      <p className="mb-2 text-sm font-bold leading-snug text-brown group-hover:text-primary sm:text-base lg:text-lg">{product.name}</p>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary sm:text-xs">{product.roast}</p>
                      <p className="mb-4 w-full flex-1 text-balance text-center text-xs leading-relaxed text-brown/70 sm:text-sm">{product.description}</p>
                      <p className="mt-auto text-lg font-bold text-brown sm:text-xl">{formatProductPrice(product.price)}</p>
                    </div>
                  </Link>
                  <div className="px-3 pb-3 sm:px-4 sm:pb-4 lg:px-5 lg:pb-5">
                    {product.price == null ? (
                      <Link
                        to="/contact"
                        className="block w-full rounded-lg bg-primary px-3 py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-sm"
                      >
                        Contact for price
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="w-full rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-sm"
                      >
                        {addedProduct === product.id ? 'Added!' : 'Add to cart'}
                      </button>
                    )}
                  </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="coffee-shop-heading" className="relative isolate overflow-hidden bg-brown px-5 py-12 text-white sm:px-8 sm:py-16 lg:py-20">
        <img
          src="https://res.cloudinary.com/vgko5mna/image/upload/v1792764938/coffee_machine_1.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#21160e]/95 via-[#21160e]/80 to-[#21160e]/45" />

        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="coffee-shop-heading" className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Visit our café
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-justify text-base leading-relaxed text-white/85 sm:text-lg">
              Visit the Legacy Coffee shop for freshly prepared coffee drinks, or place a pre-order and we’ll help arrange your pickup.
            </p>
            <p className="mx-auto mt-2 max-w-xl text-justify text-sm leading-relaxed text-white/85 sm:text-base">
              Tell us your favorite type of coffee and your preferred pickup time. We’ll confirm your pre-order directly with you.
            </p>
            <div className="mx-auto mt-8 flex w-full max-w-xs flex-col items-center gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              <a
                href="https://wa.me/256789069263?text=Hi%20Legacy%20Coffee!%20I%E2%80%99d%20like%20to%20pre-order%20a%20coffee%20drink.%20Please%20share%20today%E2%80%99s%20menu%20and%20pickup%20times."
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/40 transition-all duration-300 hover:bg-white hover:text-brown sm:w-auto md:px-9 md:py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Pre-order on WhatsApp
              </a>
              <Link
                to="/#product-list"
                className="inline-flex w-full items-center justify-center rounded-full border-2 border-white/50 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-all duration-300 hover:border-primary hover:text-primary sm:w-auto md:px-9 md:py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Shop packaged coffee
              </Link>
            </div>
          </div>
        </div>
      </section>

      <OurCoffeeSection />

      <section id="quote" className="bg-[#f8eee3] px-4 py-0 sm:px-6 sm:py-0">
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
