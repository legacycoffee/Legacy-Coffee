import { useEffect, useState } from 'react'
import { LuChevronDown } from 'react-icons/lu'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../context/api.js'
import { useCart } from '../context/useCart.js'
import useProducts from '../hooks/useProducts.js'
import { formatPrice } from '../data/products.js'
import { formatSeedlingVarieties, seedlingVarieties } from '../utils/seedlings.js'

const farmEmail = 'info@legacycoffee.org'
const farmWhatsApp = '256789069263'

const tourActivities = [
  'A Personalised Farm Tour',
  'Regenerative and/or Circular Farming in Practice',
  'Hoe Gardening Experience',
  'Red Cherries Handpicking Process',
  'The Pulping and Drying process',
  'The Coffee Brewing and Tasting Experience',
]

const tourPackages = [
  {
    id: 'individual',
    title: 'Individual Package',
    price: 'Local visitors: UGX 55,000',
    detail: 'International visitors: USD 40',
    activities: [
      ...tourActivities,
      'A Free Cup of Coffee to Drink at the Legacy Coffee Cafe',
      'A free 250g Pack of Our Roasted Single Origin Robusta Coffee.',
    ],
  },
  {
    id: 'school',
    title: 'School Package',
    price: 'UGX 5,000 / student',
    detail: 'For school groups',
    activities: tourActivities,
  },
]

const farmSlides = [
  'https://res.cloudinary.com/vgko5mna/image/upload/v1793259784/farm_4.jpg',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1793268712/coffee_farm_7.png',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1793259782/farm_6.jpg',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1793259782/farm_2.jpg',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1793259782/farm_5.jpg',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1793259782/farm_3.jpg',
]

function FarmImageSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(current => (current + 1) % farmSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const changeSlide = direction => {
    setCurrentSlide(current => (current + direction + farmSlides.length) % farmSlides.length)
  }

  return (
    <div
      aria-label="Coffee farm photo slideshow"
      aria-roledescription="carousel"
      className="relative mx-auto mb-8 aspect-[16/9] max-w-6xl overflow-hidden rounded-2xl bg-brown shadow-lg sm:aspect-[2/1] lg:mb-10"
    >
      {farmSlides.map((image, index) => (
        <img
          key={image}
          src={image}
          alt={`Coffee farm view ${index + 1} of ${farmSlides.length}`}
          loading={index === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={index !== currentSlide}
        />
      ))}
      <button
        type="button"
        aria-label="Show previous farm photo"
        onClick={() => changeSlide(-1)}
        className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brown/65 text-2xl text-white transition-colors hover:bg-brown/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-5 sm:h-12 sm:w-12"
      >
        <span aria-hidden="true">‹</span>
      </button>
      <button
        type="button"
        aria-label="Show next farm photo"
        onClick={() => changeSlide(1)}
        className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brown/65 text-2xl text-white transition-colors hover:bg-brown/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-5 sm:h-12 sm:w-12"
      >
        <span aria-hidden="true">›</span>
      </button>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2" aria-label="Choose farm photo">
        {farmSlides.map((image, index) => (
          <button
            key={image}
            type="button"
            aria-label={`Show farm photo ${index + 1}`}
            aria-current={index === currentSlide ? 'true' : undefined}
            onClick={() => setCurrentSlide(index)}
            className={`h-2.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              index === currentSlide ? 'w-7 bg-white' : 'w-2.5 bg-white/65 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default function OurCoffeeFarm() {
  const { products, isLoading: isProductsLoading, error: productsError } = useProducts()
  const { addToCart, items: cartItems } = useCart()
  const navigate = useNavigate()
  const seedlingsProduct = products.find(product => product.id === 'coffee-seedlings')
  const [seedlingQuantities, setSeedlingQuantities] = useState(() => Object.fromEntries(
    seedlingVarieties.flatMap(group => group.varieties.map(variety => [`${group.type} - ${variety}`, ''])),
  ))
  const [selectedSeedlingTypes, setSelectedSeedlingTypes] = useState({})
  const [expandedSeedlingGroups, setExpandedSeedlingGroups] = useState({})
  const selectedSeedlingVarieties = Object.fromEntries(
    Object.entries(selectedSeedlingTypes)
      .filter(([key, isSelected]) => isSelected && Number.parseInt(seedlingQuantities[key], 10) > 0)
      .map(([key]) => [key, Number.parseInt(seedlingQuantities[key], 10)]),
  )
  const seedlingQuantity = Object.values(selectedSeedlingVarieties).reduce((total, quantity) => total + quantity, 0)
  const seedlingType = formatSeedlingVarieties(selectedSeedlingVarieties)
  const seedlingsInCart = cartItems
    .filter(item => item.id === 'coffee-seedlings')
    .reduce((total, item) => total + item.quantity, 0)
  const remainingSeedlingCapacity = Math.max(0, 32767 - seedlingsInCart)
  const [seedlingReservationOpen, setSeedlingReservationOpen] = useState(false)
  const [seedlingReservation, setSeedlingReservation] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: '1',
    seedlingType: '',
    message: '',
  })
  const [seedlingReservationError, setSeedlingReservationError] = useState('')
  const [seedlingReservationSubmitting, setSeedlingReservationSubmitting] = useState(false)
  const [seedlingReservationSubmitted, setSeedlingReservationSubmitted] = useState(false)
  const [reservationOpen, setReservationOpen] = useState(false)
  const [reservationError, setReservationError] = useState('')
  const [reservationSubmitting, setReservationSubmitting] = useState(false)
  const [reservationSubmitted, setReservationSubmitted] = useState(false)
  const [reservation, setReservation] = useState({
    name: '',
    email: '',
    phone: '',
    package: 'individual',
    date: '',
    visitors: '',
    message: '',
  })

  useEffect(() => {
    if (!reservationOpen && !seedlingReservationOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setReservationOpen(false)
        setSeedlingReservationOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [reservationOpen, seedlingReservationOpen])

  const handleReservation = async event => {
    event.preventDefault()
    setReservationError('')
    setReservationSubmitting(true)
    const selectedPackage = tourPackages.find(item => item.id === reservation.package)
    const subject = `Coffee farm tour reservation - ${selectedPackage.title}`
    const inquiryMessage = [
      `Package: ${selectedPackage.title}`,
      `Preferred date: ${reservation.date}`,
      `Number of visitors/students: ${reservation.visitors}`,
      reservation.message ? `Additional details: ${reservation.message}` : '',
    ].filter(Boolean).join('\n')

    try {
      await apiRequest('/inquiries/', {
        method: 'POST',
        body: {
          kind: 'farm_reservation',
          name: reservation.name,
          email: reservation.email,
          phone: reservation.phone,
          product: 'Coffee farm educational tour',
          quantity: reservation.visitors,
          subject,
          message: inquiryMessage,
        },
      })
      setReservationSubmitted(true)
    } catch (error) {
      setReservationError(error.message)
    } finally {
      setReservationSubmitting(false)
    }
  }

  const handleSeedlingBuy = () => {
    if (!seedlingsProduct || !seedlingQuantity) return
    addToCart({
      ...seedlingsProduct,
      seedling_type: seedlingType,
      seedling_varieties: selectedSeedlingVarieties,
    }, seedlingQuantity)
    navigate('/cart')
  }

  const handleSeedlingReservation = async event => {
    event.preventDefault()
    setSeedlingReservationError('')
    if (!seedlingQuantity) {
      setSeedlingReservationError('Choose a quantity for at least one seedling variety.')
      return
    }
    setSeedlingReservationSubmitting(true)

    try {
      await apiRequest('/inquiries/', {
        method: 'POST',
        body: {
          kind: 'seedling_reservation',
          name: seedlingReservation.name,
          email: seedlingReservation.email,
          phone: seedlingReservation.phone,
          product: 'Coffee seedlings',
          quantity: seedlingReservation.quantity,
          subject: 'Coffee seedling reservation',
          message: [
            `Requested quantity: ${seedlingReservation.quantity} seedlings`,
            `Varieties and quantities: ${seedlingReservation.seedlingType}`,
            seedlingReservation.message ? `Additional details: ${seedlingReservation.message}` : '',
          ].filter(Boolean).join('\n'),
        },
      })
      setSeedlingReservationSubmitted(true)
    } catch (error) {
      setSeedlingReservationError(error.message)
    } finally {
      setSeedlingReservationSubmitting(false)
    }
  }

  const makeWhatsAppUrl = packageTitle => {
    const message = `Hello Legacy Coffee! I would like to enquire about booking the ${packageTitle} for a visit to your coffee farm.`
    return `https://wa.me/${farmWhatsApp}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="home-page overflow-x-hidden bg-[#fffdfa]">
      <section className="relative isolate flex min-h-[560px] items-center justify-center overflow-hidden bg-[#351a08] px-6 py-20 text-center md:min-h-[680px] md:px-10">
        <img
          src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792508243/coffee_farm.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#241308]/60 via-[#241308]/65 to-[#241308]/80"
        />
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-4xl font-black leading-tight text-white sm:text-5xl md:text-7xl">
              Our Coffee Farm
            </h1>
            <p className="mx-auto max-w-2xl text-balance text-center text-base leading-relaxed text-white/85 md:text-xl">
              Discover coffee beyond the cup. Visit our farm to experience the entire journey of coffee, from growing and harvesting to pulping, drying, and finally, the cup.
            </p>
            <a
              href="#farm-visits"
              className="mt-8 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/40 transition-all duration-300 hover:bg-white hover:text-brown sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Book A Visit
            </a>
          </div>
        </div>
      </section>

      <section className="bg-peach-light px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Our farm story</p>
          </div>
          <div id="how-we-started" className="mx-auto grid max-w-2xl scroll-mt-24 gap-5">
            {[
              {
                title: 'How we started?',
                description: 'We started in 2018 as a family-owned coffee estate that focused on coffee cultivation; we later grew a pool of smallholder coffee farmers in our community that provides our coffee.',
              },
            ].map(({ title, description }) => (
              <article key={title} className="min-h-40 rounded-2xl bg-white p-6 text-center shadow-sm md:p-8">
                <h3 className="mb-4 text-xl font-bold text-brown">{title}</h3>
                <p className="text-justify text-sm leading-relaxed text-brown/75">{description}</p>
                <Link
                  to="/about/patrick-muhereza"
                  className="mx-auto mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Read More
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="farm-visits" className="scroll-mt-20 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-center text-3xl font-black text-brown md:mb-12 md:text-5xl">Visit Our Coffee Farm</h2>
          <FarmImageSlider />
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <p className="mb-2 text-center text-base leading-relaxed text-brown md:text-lg">
              <strong className="font-bold">Educational Tours:</strong>
            </p>
            <p className="text-justify text-base leading-relaxed text-brown/75 md:text-lg">
              Have you ever imagined how coffee gets from the plant to the cup? We train individuals, schools and tourists on the process of regenerative coffee farming and local processing of coffee beans in Uganda.
            </p>
            <p className="mt-4 font-semibold text-brown">Explore Educational Plans:</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {tourPackages.map(tour => (
              <article key={tour.id} className="flex flex-col items-center rounded-2xl border border-peach-mid/70 bg-white p-6 text-center shadow-sm md:p-8">
                <div className="mb-6 w-full border-b border-peach-mid/60 pb-5">
                  <h3 className="text-2xl font-bold text-brown">{tour.title}</h3>
                  {tour.id === 'individual' ? (
                    <div className="mx-auto mt-3 w-fit text-left">
                      <p className="text-sm font-black text-primary">{tour.price}</p>
                      <p className="mt-1 text-sm font-black text-primary">{tour.detail}</p>
                    </div>
                  ) : (
                    <>
                      <p className="mt-3 text-sm font-black text-primary">{tour.price}</p>
                      <p className="mt-1 text-sm text-brown/70">{tour.detail}</p>
                    </>
                  )}
                  <p className="mt-4 text-sm font-semibold text-brown">Includes:</p>
                </div>
                <ul className="mb-8 w-full flex-1 space-y-3 text-left">
                  {tour.activities.map(activity => (
                    <li key={activity} className="flex items-start gap-3 text-sm leading-relaxed text-brown/80 md:text-base">
                      <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto grid w-full grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setReservation(current => ({ ...current, package: tour.id }))
                      setReservationError('')
                      setReservationSubmitted(false)
                      setReservationOpen(true)
                    }}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-2 py-3 text-center text-xs font-bold text-white transition-colors hover:bg-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-5 sm:text-sm"
                  >
                    Make a Reservation
                  </button>
                  <a
                    href={makeWhatsAppUrl(tour.title)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-primary px-2 py-3 text-center text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-5 sm:text-sm"
                  >
                    WhatsApp
                  </a>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-16 rounded-2xl bg-peach-light p-6 md:mt-20 md:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-3 text-center text-base leading-relaxed text-brown md:text-lg">
                <strong className="font-bold">Coffee Seedlings:</strong>
              </p>
              <p className="text-justify text-base leading-relaxed text-brown/80 md:text-lg">
                Are you looking to plant coffee? We sell high quality coffee seedlings that ensure you maximise your investment in coffee farming. Our seedlings are nationally approved to ensure you plant varieties that are drought and disease resistant. Get up to 5% off for all orders above 1000 seedlings.
              </p>
              <div className="mt-6 grid gap-6">
                <h4 className="text-sm font-bold text-brown">Select coffee seedlings</h4>
                <div className="grid items-start gap-5 md:grid-cols-2">
                  {seedlingVarieties.map(group => (
                    <section key={group.type} className="overflow-hidden rounded-xl border border-peach-mid/70 bg-white">
                      <button
                        type="button"
                        aria-expanded={Boolean(expandedSeedlingGroups[group.type])}
                        aria-controls={`seedling-varieties-${group.type.toLowerCase()}`}
                        onClick={() => setExpandedSeedlingGroups(current => ({
                          ...current,
                          [group.type]: !current[group.type],
                        }))}
                        className="flex min-h-16 w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-bold text-brown transition-colors hover:bg-peach-light/60 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary"
                      >
                        <span>{group.type} varieties</span>
                        <LuChevronDown
                          aria-hidden="true"
                          className={`h-5 w-5 shrink-0 transition-transform ${expandedSeedlingGroups[group.type] ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {expandedSeedlingGroups[group.type] && (
                      <div id={`seedling-varieties-${group.type.toLowerCase()}`} className="grid items-start gap-3 px-4 pb-4 sm:grid-cols-2">
                        {group.varieties.map(variety => {
                          const key = `${group.type} - ${variety}`
                          const isSelected = Boolean(selectedSeedlingTypes[key])
                          return (
                            <div key={key} className="self-start rounded-lg border border-peach-mid/60 p-3">
                              <label className="flex items-center gap-2 text-sm font-semibold text-brown">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={event => {
                                    const checked = event.target.checked
                                    setSelectedSeedlingTypes(current => ({ ...current, [key]: checked }))
                                    if (!checked) {
                                      setSeedlingQuantities(current => ({ ...current, [key]: '' }))
                                    }
                                  }}
                                  className="h-4 w-4 accent-[#8b4e2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                />
                                {variety}
                              </label>
                              {isSelected && (
                                <label className="mt-3 block text-xs font-semibold text-brown/80" htmlFor={`seedling-quantity-${group.type}-${variety}`}>
                                  Number of seedlings
                                  <input
                                    id={`seedling-quantity-${group.type}-${variety}`}
                                    type="number"
                                    min="1"
                                    max={Math.max(
                                      1,
                                      Math.min(
                                        32767,
                                        remainingSeedlingCapacity - seedlingQuantity + (Number.parseInt(seedlingQuantities[key], 10) || 0),
                                      ),
                                    )}
                                    step="1"
                                    value={seedlingQuantities[key]}
                                    onChange={event => {
                                      const value = event.target.value
                                      const parsedValue = Number.parseInt(value, 10)
                                      const maxQuantity = Math.max(
                                        1,
                                        Math.min(
                                          32767,
                                          remainingSeedlingCapacity - seedlingQuantity + (Number.parseInt(seedlingQuantities[key], 10) || 0),
                                        ),
                                      )
                                      setSeedlingQuantities(current => ({
                                        ...current,
                                        [key]: value === '' ? '' : String(Math.min(maxQuantity, parsedValue || 1)),
                                      }))
                                    }}
                                    aria-label={`Number of ${key} seedlings`}
                                    className="mt-1.5 block w-full rounded-lg border border-peach-mid bg-white px-3 py-2 font-normal outline-none focus:border-primary"
                                  />
                                </label>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      )}
                    </section>
                  ))}
                </div>
                <p className="text-center text-sm font-semibold text-brown">
                  Total selected: {seedlingQuantity.toLocaleString()} seedlings
                  <br />
                  {formatPrice(seedlingsProduct?.price ?? 2000)} / seedling
                  {seedlingQuantity > 1000 && (
                    <span className="mt-1 block text-primary">5% bulk discount: {formatPrice(Math.round((seedlingsProduct?.price ?? 2000) * 0.95))} each</span>
                  )}
                </p>
              </div>
              <div className="mx-auto mt-6 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={isProductsLoading || !seedlingsProduct || !seedlingQuantity || !remainingSeedlingCapacity}
                  onClick={handleSeedlingBuy}
                  className="min-h-12 rounded-full bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProductsLoading ? 'Loading product…' : !remainingSeedlingCapacity ? 'Maximum seedlings already in cart' : !seedlingQuantity ? 'Choose seedling quantities' : `Buy · ${formatPrice((seedlingsProduct?.price ?? 2000) * seedlingQuantity * (seedlingQuantity > 1000 ? 0.95 : 1))}`}
                </button>
                <button
                  type="button"
                  disabled={!seedlingQuantity}
                  onClick={() => {
                    setSeedlingReservation({ name: '', email: '', phone: '', quantity: String(seedlingQuantity), seedlingType, message: '' })
                    setSeedlingReservationError('')
                    setSeedlingReservationSubmitted(false)
                    setSeedlingReservationOpen(true)
                  }}
                  className="min-h-12 rounded-full border border-primary px-6 py-3 font-bold text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Make a Reservation
                </button>
              </div>
              {productsError && <p role="alert" className="mt-3 text-sm text-red-700">Could not load seedlings: {productsError}</p>}
              {!isProductsLoading && !productsError && !seedlingsProduct && (
                <p role="alert" className="mt-3 text-sm text-red-700">Coffee seedlings are not available in the catalog yet. Please try again later.</p>
              )}
            </div>
          </section>

          <div className="mt-8 text-center">
            <Link
              to="/#coffee-shop-heading"
              className="inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-primary px-7 py-3 text-center text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/40 transition-all duration-300 hover:bg-brown sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Grab a Coffee at Our Cafe
            </Link>
          </div>

        </div>
      </section>

      {reservationOpen && (
        <div
          className="farm-reservation-scroll fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-brown/70 px-4 py-6 backdrop-blur-sm"
          onClick={event => {
            if (event.target === event.currentTarget) setReservationOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="farm-reservation-title"
            className="farm-reservation-scroll relative my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-peach-light p-5 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={() => setReservationOpen(false)}
              aria-label="Close reservation form"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-2xl text-brown/70 transition-colors hover:bg-white hover:text-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              &times;
            </button>
            <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Plan your visit</p>
            <h2 id="farm-reservation-title" className="mb-3 text-3xl font-black text-brown md:text-4xl">Make a Reservation</h2>
          </div>

          {reservationSubmitted ? (
            <div role="status" className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-4xl" aria-hidden="true">✓</p>
              <h3 className="mt-3 text-xl font-bold text-brown">Reservation request sent</h3>
              <p className="mt-2 text-sm leading-relaxed text-brown/70">
                Your request has been received. Our team will be in touch.
              </p>
              <button
                type="button"
                onClick={() => setReservationOpen(false)}
                className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-brown"
              >
                Done
              </button>
            </div>
          ) : (
          <form onSubmit={handleReservation} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-brown">
                Your name
                <input
                  required
                  autoComplete="name"
                  value={reservation.name}
                  onChange={event => setReservation({ ...reservation, name: event.target.value })}
                  className="w-full rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-brown">
                Email address
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={reservation.email}
                  onChange={event => setReservation({ ...reservation, email: event.target.value })}
                  className="w-full rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-brown">
                Phone number
                <input
                  type="tel"
                  autoComplete="tel"
                  value={reservation.phone}
                  onChange={event => setReservation({ ...reservation, phone: event.target.value })}
                  className="w-full rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-brown">
                Tour package
                <select
                  required
                  value={reservation.package}
                  onChange={event => setReservation({ ...reservation, package: event.target.value })}
                  className="w-full rounded-lg border border-peach-mid bg-white px-4 py-3 font-normal outline-none focus:border-primary"
                >
                  {tourPackages.map(tour => <option key={tour.id} value={tour.id}>{tour.title}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-brown">
                Preferred visit date
                <input
                  required
                  type="date"
                  value={reservation.date}
                  onChange={event => setReservation({ ...reservation, date: event.target.value })}
                  className="w-full rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-brown">
                Number of visitors/students
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={reservation.visitors}
                  onChange={event => setReservation({ ...reservation, visitors: event.target.value })}
                  className="w-full rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                />
              </label>
            </div>
            <label className="block space-y-2 text-sm font-semibold text-brown">
              Additional details
              <textarea
                rows={4}
                value={reservation.message}
                onChange={event => setReservation({ ...reservation, message: event.target.value })}
                className="w-full resize-y rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
              />
            </label>
            {reservationError && <p role="alert" className="text-sm text-red-700">{reservationError}</p>}
            <div>
              <button
                type="submit"
                disabled={reservationSubmitting}
                className="w-full rounded-full bg-primary px-6 py-3.5 font-bold text-white transition-colors hover:bg-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
              >
                {reservationSubmitting ? 'Sending reservation…' : 'Send reservation request'}
              </button>
            </div>
          </form>
          )}
            </div>
          </section>
        </div>
      )}

      {seedlingReservationOpen && (
        <div
          className="farm-reservation-scroll fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-brown/70 px-4 py-6 backdrop-blur-sm"
          onClick={event => {
            if (event.target === event.currentTarget) setSeedlingReservationOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="seedling-reservation-title"
            className="farm-reservation-scroll relative my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-peach-light p-5 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={() => setSeedlingReservationOpen(false)}
              aria-label="Close seedling reservation form"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-2xl text-brown/70 transition-colors hover:bg-white hover:text-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              &times;
            </button>
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Coffee Seedlings</p>
                <h2 id="seedling-reservation-title" className="mb-3 text-3xl font-black text-brown md:text-4xl">Make a Reservation</h2>
                <p className="text-sm leading-relaxed text-brown/70">
                  Submit your request and it will be emailed directly to {farmEmail}.
                </p>
              </div>

              {seedlingReservationSubmitted ? (
                <div role="status" className="rounded-2xl bg-white p-8 text-center shadow-sm">
                  <p className="text-4xl" aria-hidden="true">✓</p>
                  <h3 className="mt-3 text-xl font-bold text-brown">Reservation request received</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brown/70">
                    Your request for {seedlingReservation.quantity} seedlings has been received. Our team will be in touch.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSeedlingReservationOpen(false)}
                    className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-brown"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSeedlingReservation} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm md:p-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-semibold text-brown">
                      Your name
                      <input
                        required
                        autoComplete="name"
                        value={seedlingReservation.name}
                        onChange={event => setSeedlingReservation({ ...seedlingReservation, name: event.target.value })}
                        className="w-full rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-semibold text-brown">
                      Email address
                      <input
                        required
                        type="email"
                        autoComplete="email"
                        value={seedlingReservation.email}
                        onChange={event => setSeedlingReservation({ ...seedlingReservation, email: event.target.value })}
                        className="w-full rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-semibold text-brown">
                      Phone number
                      <input
                        type="tel"
                        autoComplete="tel"
                        value={seedlingReservation.phone}
                        onChange={event => setSeedlingReservation({ ...seedlingReservation, phone: event.target.value })}
                        className="w-full rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-semibold text-brown">
                      Number of seedlings
                      <input
                        required
                        type="number"
                        min="1"
                        max="32767"
                        step="1"
                        readOnly
                        value={seedlingReservation.quantity}
                        className="w-full rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-semibold text-brown sm:col-span-2">
                      Varieties and quantities
                      <textarea
                        required
                        readOnly
                        rows={3}
                        value={seedlingReservation.seedlingType}
                        className="w-full resize-y rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                      />
                    </label>
                  </div>
                  <label className="block space-y-2 text-sm font-semibold text-brown">
                    Additional details
                    <textarea
                      rows={4}
                      value={seedlingReservation.message}
                      onChange={event => setSeedlingReservation({ ...seedlingReservation, message: event.target.value })}
                      className="w-full resize-y rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                    />
                  </label>
                  {seedlingReservationError && <p role="alert" className="text-sm text-red-700">{seedlingReservationError}</p>}
                  <div>
                    <button
                      type="submit"
                      disabled={seedlingReservationSubmitting}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
                    >
                      {seedlingReservationSubmitting ? 'Sending reservation…' : 'Send reservation request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
