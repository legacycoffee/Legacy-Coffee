import { useEffect, useState } from 'react'
import { FiArrowUpRight, FiMail, FiMessageCircle } from 'react-icons/fi'
import { apiRequest } from '../context/api.js'

const email = 'info@legacycoffee.org'
const whatsapp = '256789069263'
const inquiry = 'Hello Legacy Coffee, I am interested in your coffee research and feasibility study services. Please get in touch with me.'
const subject = 'Coffee research and feasibility study inquiry'

const farmSetupPackages = [
  {
    id: 'starter',
    title: 'Starter Package',
    price: 'UGX 300K / Acre',
    detail: 'One off',
    features: [
      'Soil evaluation',
      'Spacing strategy',
      'Layout design',
      '2 site supervisory visits',
    ],
  },
  {
    id: 'standard',
    title: 'Standard Package',
    price: 'UGX 250K / Acre',
    detail: 'Then UGX 200K / month',
    features: [
      'Everything in the Starter Package',
      'Monthly health checks',
      'Fertilizer application schedules',
      'Weed/pest management oversight',
    ],
  },
]

export default function OurServices() {
  const [reservationOpen, setReservationOpen] = useState(false)
  const [reservationSubmitting, setReservationSubmitting] = useState(false)
  const [reservationError, setReservationError] = useState('')
  const [reservation, setReservation] = useState({
    name: '',
    email: '',
    phone: '',
    package: 'starter',
    acres: '1',
    startDate: '',
    message: '',
  })

  const emailHref = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(inquiry)}`
  const whatsappHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(inquiry)}`

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

  const handleSetupReservation = async event => {
    event.preventDefault()
    setReservationError('')
    setReservationSubmitting(true)

    const selectedPackage = farmSetupPackages.find(item => item.id === reservation.package)
    const reservationSubject = `Coffee farm setup reservation - ${selectedPackage.title}`
    const body = [
      'Coffee farm setup reservation request',
      `Name: ${reservation.name}`,
      `Email: ${reservation.email}`,
      `Phone: ${reservation.phone || 'Not provided'}`,
      `Package: ${selectedPackage.title}`,
      `Package price: ${selectedPackage.price}; ${selectedPackage.detail}`,
      `Farm size: ${reservation.acres} acre(s)`,
      `Preferred start date: ${reservation.startDate || 'Not provided'}`,
      `Additional details: ${reservation.message || 'None'}`,
    ].join('\n')
    const message = [
      `Package: ${selectedPackage.title}`,
      `Package price: ${selectedPackage.price}; ${selectedPackage.detail}`,
      `Farm size: ${reservation.acres} acre(s)`,
      `Preferred start date: ${reservation.startDate || 'Not provided'}`,
      `Additional details: ${reservation.message || 'None'}`,
    ].join('\n')

    try {
      await apiRequest('/inquiries/', {
        method: 'POST',
        body: {
          kind: 'farm_setup',
          name: reservation.name,
          email: reservation.email,
          phone: reservation.phone,
          product: `Coffee farm setup - ${selectedPackage.title}`,
          quantity: `${reservation.acres} acre(s)`,
          subject: reservationSubject,
          message,
        },
      })
    } catch (error) {
      setReservationError(error.message)
      return
    } finally {
      setReservationSubmitting(false)
    }

    const deliveryMethod = event.nativeEvent.submitter?.value
    if (deliveryMethod === 'whatsapp') {
      window.location.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(body)}`
      return
    }
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(reservationSubject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="bg-white">
      <section className="relative isolate flex min-h-[320px] items-center justify-center overflow-hidden px-6 py-20 text-center">
        <img
          src="https://res.cloudinary.com/vgko5mna/image/upload/v1793259784/farm_4.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-brown/65" />
        <div className="relative">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-peach"></p>
          <h1 className="text-4xl font-black text-white md:text-6xl">Our Services</h1>
        </div>
      </section>

      <section className="px-6 pt-12 pb-4 md:pt-16 md:pb-4">
        <div className="mx-auto max-w-6xl text-left">
          <div className="max-w-3xl">
            <p className="text-base leading-relaxed text-brown/80">
            At Legacy Coffee, we believe that great coffee begins with empowered farmers.
            </p>
            <p className="mt-4 text-base leading-relaxed text-brown/80">
            In a market that has long rewarded volume over value, we are driving a shift, supporting smallholders to produce premium Robusta that commands higher prices and competes globally.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pt-4 pb-16 md:pt-4 md:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-base font-bold leading-relaxed text-brown md:text-lg">
              1. Research &amp; Feasibility Studies
            </h2>
            <p className="mt-6 text-base leading-relaxed text-brown/80">
              We help companies and NGOs to conduct research in coffee farming and the supply chain of coffee. We do the difficult work of scoping/mapping, farmer outreach, farmer relationship management and anything in between.
            </p>
          </div>

          <div className="mt-12">
            <h3 className="text-xl font-bold text-brown">See case studies</h3>
          </div>

          <div className="mt-12">
            <h3 className="max-w-3xl text-lg font-bold leading-relaxed text-brown">
              Do you have a coffee research study of interest in Uganda?
            </h3>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-brown/80">
              Rely on our expertise to get the most out of it. Contact us today for a custom quote.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={emailHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <FiMail aria-hidden="true" />
                Email Us
                <FiArrowUpRight aria-hidden="true" />
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-6 py-3 font-bold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <FiMessageCircle aria-hidden="true" />
                WhatsApp Us
                <FiArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="mt-12 max-w-3xl">
            <h2 className="text-base font-bold leading-relaxed text-brown md:text-lg">
              2. Farmer Trainings &amp; Extension Services
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brown/80">
              At Legacy Coffee, we believe that great coffee begins with empowered farmers. In a market that has long rewarded volume over value, we are driving a shift, supporting smallholders to produce premium Robusta that commands higher prices and competes globally. We partner with NGOs and companies to implement good coffee farming practices such as Agro-forestry, sustainable water management and organic farming.
            </p>
          </div>

          <div className="mt-12 max-w-3xl">
            <h2 className="text-base font-bold leading-relaxed text-brown md:text-lg">
              3. Coffee Farm Setups
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brown/80">
              We provide individuals and institutions with expertise to set up standard coffee farms that maximise yields, and incomes while ensuring sustainable production. Are you an individual looking to set up a coffee farm? Explore our packages
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {farmSetupPackages.map(setupPackage => {
              const buyMessage = `Hello Legacy Coffee, I would like to buy the ${setupPackage.title} for my coffee farm. Price: ${setupPackage.price}; ${setupPackage.detail}. Please get in touch with me.`
              const buyHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(buyMessage)}`

              return (
                <article key={setupPackage.id} className="flex flex-col rounded-2xl border border-peach-mid/70 bg-white p-6 shadow-sm md:p-8">
                  <div className="mb-6 border-b border-peach-mid/60 pb-5">
                    <h3 className="text-2xl font-bold text-brown">{setupPackage.title}</h3>
                    <p className="mt-3 text-2xl font-black text-primary">{setupPackage.price}</p>
                    <p className="mt-1 text-sm text-brown/70">{setupPackage.detail}</p>
                    <p className="mt-4 text-sm font-semibold text-brown">Includes:</p>
                  </div>
                  <ul className="mb-8 flex-1 space-y-3">
                    {setupPackage.features.map(feature => (
                      <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-brown/80 md:text-base">
                        <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={buyHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-2 py-3 text-center text-xs font-bold text-white transition-colors hover:bg-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-5 sm:text-sm"
                    >
                      Buy
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setReservation(current => ({ ...current, package: setupPackage.id }))
                        setReservationError('')
                        setReservationOpen(true)
                      }}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-primary px-2 py-3 text-center text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-5 sm:text-sm"
                    >
                      Make a Reservation
                    </button>
                  </div>
                </article>
              )
            })}
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
            aria-labelledby="farm-setup-reservation-title"
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
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Coffee farm setup</p>
                <h2 id="farm-setup-reservation-title" className="mb-3 text-3xl font-black text-brown md:text-4xl">Make a Reservation</h2>
                <p className="text-sm leading-relaxed text-brown/70">
                  Enter your details, then choose to send your reservation request by email or WhatsApp.
                </p>
              </div>

              <form onSubmit={handleSetupReservation} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm md:p-8">
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
                    Farm setup package
                    <select
                      required
                      value={reservation.package}
                      onChange={event => setReservation({ ...reservation, package: event.target.value })}
                      className="w-full rounded-lg border border-peach-mid bg-white px-4 py-3 font-normal outline-none focus:border-primary"
                    >
                      {farmSetupPackages.map(setupPackage => (
                        <option key={setupPackage.id} value={setupPackage.id}>{setupPackage.title}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-brown">
                    Farm size (acres)
                    <input
                      required
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={reservation.acres}
                      onChange={event => setReservation({ ...reservation, acres: event.target.value })}
                      className="w-full rounded-lg border border-peach-mid px-4 py-3 font-normal outline-none focus:border-primary"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-brown">
                    Preferred start date
                    <input
                      type="date"
                      value={reservation.startDate}
                      onChange={event => setReservation({ ...reservation, startDate: event.target.value })}
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="submit"
                    name="delivery"
                    value="email"
                    disabled={reservationSubmitting}
                    className="w-full rounded-full bg-primary px-6 py-3.5 font-bold text-white transition-colors hover:bg-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
                  >
                    {reservationSubmitting ? 'Saving reservation…' : 'Continue to Email'}
                  </button>
                  <button
                    type="submit"
                    name="delivery"
                    value="whatsapp"
                    disabled={reservationSubmitting}
                    className="w-full rounded-full border border-primary px-6 py-3.5 font-bold text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
                  >
                    {reservationSubmitting ? 'Saving reservation…' : 'Send via WhatsApp'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
