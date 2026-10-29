import { useEffect, useState } from 'react'

const farmEmail = 'info@legacycoffee.org'
const farmWhatsApp = '256752254962'

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
    price: 'UGX 55,000',
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

export default function OurCoffeeFarm() {
  const [reservationOpen, setReservationOpen] = useState(false)
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
    if (!reservationOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = event => {
      if (event.key === 'Escape') setReservationOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [reservationOpen])

  const handleReservation = event => {
    event.preventDefault()
    const selectedPackage = tourPackages.find(item => item.id === reservation.package)
    const subject = `Coffee farm tour reservation - ${selectedPackage.title}`
    const body = [
      'Coffee farm tour reservation request',
      `Name: ${reservation.name}`,
      `Email: ${reservation.email}`,
      `Phone: ${reservation.phone || 'Not provided'}`,
      `Package: ${selectedPackage.title}`,
      `Preferred date: ${reservation.date}`,
      `Number of visitors/students: ${reservation.visitors}`,
      `Additional details: ${reservation.message || 'None'}`,
    ].join('\n')
    const deliveryMethod = event.nativeEvent.submitter?.value
    if (deliveryMethod === 'whatsapp') {
      window.location.href = `https://wa.me/${farmWhatsApp}?text=${encodeURIComponent(body)}`
      return
    }

    window.location.href = `mailto:${farmEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const makeWhatsAppUrl = packageTitle => {
    const message = `Hello Legacy Coffee! I would like to enquire about booking the ${packageTitle} for a visit to your coffee farm.`
    return `https://wa.me/${farmWhatsApp}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="home-page overflow-x-hidden bg-[#fffdfa]">
      <section className="relative isolate flex min-h-[560px] items-center overflow-hidden bg-[#351a08] px-6 py-20 md:min-h-[680px] md:px-10">
        <img
          src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792508243/coffee_farm.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#241308]/85 via-[#241308]/55 to-[#241308]/15"
        />
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-primary md:text-base">
              A visit from plant to cup
            </p>
            <h1 className="mb-6 text-4xl font-black leading-tight text-white sm:text-5xl md:text-7xl">
              Our Coffee Farm
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-white/85 md:text-xl">
              Discover coffee growing and local processing in Uganda through a hands-on visit to our farm.
            </p>
            <a
              href="#farm-visits"
              className="mt-8 inline-flex rounded-full bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore farm tours
            </a>
          </div>
        </div>
      </section>

      <section className="bg-peach-light px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Our farm story</p>
            <h2 className="text-3xl font-black text-brown md:text-4xl">Rooted in the farm</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {['Why it started', 'How it started', 'Where we are going'].map(title => (
              <article key={title} className="min-h-40 rounded-2xl bg-white p-6 shadow-sm md:p-8">
                <h3 className="mb-4 text-xl font-bold text-brown">{title}</h3>
                <p className="text-sm italic text-brown/60">Farm story details coming soon.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="farm-visits" className="scroll-mt-20 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-center text-3xl font-black text-brown md:mb-12 md:text-5xl">Visit Our Coffee Farm</h2>
          <div className="mb-8 text-left lg:w-[calc(50%-0.75rem)]">
            <div className="text-left">
              <p className="mb-2 text-base leading-relaxed text-brown md:text-lg">
                <strong className="font-bold">1. Educational Tours:</strong>
              </p>
              <p className="text-base leading-relaxed text-brown/75 md:text-lg">
                Have you ever imagined how coffee gets from the plant to the cup? We train individuals, schools and tourists on the process of regenerative coffee farming and local processing of coffee beans in Uganda.
              </p>
              <p className="mt-4 font-semibold text-brown">Explore Educational Plans:</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {tourPackages.map(tour => (
              <article key={tour.id} className="flex flex-col rounded-2xl border border-peach-mid/70 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 border-b border-peach-mid/60 pb-5">
                  <h3 className="text-2xl font-bold text-brown">{tour.title}</h3>
                  <p className="mt-3 text-2xl font-black text-primary">{tour.price}</p>
                  <p className="mt-1 text-sm text-brown/70">{tour.detail}</p>
                  <p className="mt-4 text-sm font-semibold text-brown">Includes:</p>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {tour.activities.map(activity => (
                    <li key={activity} className="flex items-start gap-3 text-sm leading-relaxed text-brown/80 md:text-base">
                      <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setReservation(current => ({ ...current, package: tour.id }))
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

        </div>
      </section>

      {reservationOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-brown/70 px-4 py-6 backdrop-blur-sm"
          onClick={event => {
            if (event.target === event.currentTarget) setReservationOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="farm-reservation-title"
            className="relative my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-peach-light p-5 shadow-2xl sm:p-8"
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
            <p className="text-sm leading-relaxed text-brown/70">
              Fill in your details, then choose to send your reservation request by email or WhatsApp.
            </p>
          </div>

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
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="submit"
                name="delivery"
                value="email"
                className="w-full rounded-full bg-primary px-6 py-3.5 font-bold text-white transition-colors hover:bg-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Continue to Email
              </button>
              <button
                type="submit"
                name="delivery"
                value="whatsapp"
                className="w-full rounded-full border border-primary px-6 py-3.5 font-bold text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Send via WhatsApp
              </button>
            </div>
            <p className="text-center text-xs leading-relaxed text-brown/60">
              Email requests are addressed to{' '}
              <a href={`mailto:${farmEmail}`} className="font-semibold underline underline-offset-2">{farmEmail}</a>. WhatsApp requests open a chat with Legacy Coffee.
            </p>
          </form>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
