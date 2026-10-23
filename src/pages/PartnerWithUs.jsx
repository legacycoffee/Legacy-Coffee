import { useState } from 'react'

const partnerTypes = ['NGO / Donor', 'Restaurant / Hotel', 'Exporter / Importer', 'Corporate Gifting', 'Community Project', 'Other']

export default function PartnerWithUs() {
  const [form, setForm] = useState({ name: '', org: '', email: '', phone: '', type: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = e => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="bg-[#fffdfa]">
      <section className="home-page relative isolate min-h-[680px] overflow-hidden bg-[#351a08] lg:min-h-[calc(100svh-5rem)]">
        <img
          src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792508243/coffee_farm.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-0 h-full w-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-[#241308]/12"
        />
        <svg
          aria-hidden="true"
          className="absolute inset-0 z-0 h-full w-full"
          viewBox="0 0 1920 760"
          preserveAspectRatio="none"
        >
          <path
            fill="#fff8ee"
            fillOpacity="0.65"
            d="M0 0H1465C1505 150 1502 265 1470 375C1422 540 1270 614 1060 660C820 712 632 777 330 760C157 750 57 652 0 420V0Z"
          />
          <path
            fill="#F58537"
            fillOpacity="0.6"
            d="M1920 350C1760 376 1650 430 1555 505C1460 580 1404 666 1345 760H1920V350Z"
          />
        </svg>
        <div className="relative z-10 mx-auto flex min-h-[680px] max-w-[1580px] flex-col items-center justify-center gap-10 px-6 pb-20 pt-16 md:px-10 lg:min-h-[calc(100svh-5rem)] lg:px-12 lg:pb-16 lg:pt-8">
          <div className="relative z-10 mx-auto max-w-[980px] text-center">
            <p
              className="mb-3 text-lg font-bold uppercase tracking-[0.25em] text-primary sm:text-xl md:mb-4 md:text-2xl"
              style={{ animation: 'fadeUp 0.7s ease both' }}
            >
              Let’s build together
            </p>
            <h1
              className="mb-4 font-black leading-[1.1] text-white md:mb-5"
              style={{ animation: 'fadeUp 0.8s 0.1s ease both' }}
            >
              Partnerships
              <br />
              <span className="text-primary">That Create Lasting Value</span>
            </h1>
            <p
              className="mx-auto mb-8 max-w-2xl px-2 text-sm leading-relaxed text-white/80 md:mb-10 md:text-lg"
              style={{ animation: 'fadeUp 0.8s 0.2s ease both' }}
            >
              We work with cafés, restaurants, hotels, retailers and individuals who share our passion for exceptional coffee.
            </p>
          </div>
          <a
            href="#partnership-form"
            className="relative z-10 inline-flex items-center justify-self-center gap-5 rounded-full bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/40 transition-all duration-300 hover:bg-white hover:text-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:px-9 md:py-4"
          >
            Partner With Us <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <section className="bg-[#fff8ee] px-6 py-14 md:py-18">
        <div className="mx-auto max-w-6xl space-y-8 text-left text-base leading-relaxed text-brown/90 md:text-xl">
          <p>
            At Legacy Coffee, we believe that great coffee begins with empowered farmers.
            <br className="hidden md:block" /> In a market that has long rewarded volume over value, we are driving a shift, supporting smallholders to produce premium Robusta that commands higher prices and competes globally.
          </p>
          <p>
            Our model blends training, mentorship, sustainability, and fair pricing to unlock opportunities for farmers like Monica in Rwibaale, who can now sell pre-booked coffee at fair prices, invest in land, and expand her farm.
          </p>
          <p>
            We welcome collaborations with donors, NGOs, restaurants, hotels, exporters, and institutions. Whether through bulk orders, corporate gifting, or joint community projects, together we can make a greater impact.
          </p>
          <div className="pt-2">
            <h2 className="mb-5 text-3xl font-normal leading-tight text-primary md:text-4xl">
              Your Investment helps us;
            </h2>
            <ul className="space-y-1 text-base leading-relaxed md:text-xl">
              <li className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span>Train more coffee farmers &amp; producers at our Kyenjojo learning site</span>
              </li>
              <li className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span>Invest in eco-friendly processing and traceable sourcing</span>
              </li>
              <li className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span>Connect farmers to premium international buyers</span>
              </li>
              <li className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span>Expand Uganda’s presence in the global coffee value chain</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="partnerships" className="bg-peach-light px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h1 className="mb-4 text-3xl font-black text-brown md:text-4xl">Our Partners</h1>
          </div>
          <div className="overflow-hidden">
            <div className="partner-logo-track flex w-max items-center">
              {[0, 1].map(copy => (
                <div key={copy} className="flex shrink-0 items-center gap-16 pr-16" aria-hidden={copy === 1}>
                  {[
                    {
                      src: 'https://res.cloudinary.com/vgko5mna/image/upload/v1792596313/OIP-1.webp',
                      alt: 'Partner organization logo',
                    },
                    {
                      src: 'https://res.cloudinary.com/vgko5mna/image/upload/v1792596313/Yonder-Life-Final-Logo-03.png',
                      alt: 'Yonder Life',
                    },
                    {
                      src: 'https://res.cloudinary.com/vgko5mna/image/upload/v1792596314/partner.png',
                      alt: 'Partner organization logo',
                    },
                    {
                      src: 'https://res.cloudinary.com/vgko5mna/image/upload/v1792596314/KCCA-Kampala-Capital-City-Authority-Logo-Vector.svg-.png',
                      alt: 'Kampala Capital City Authority',
                    },
                    {
                      src: 'https://res.cloudinary.com/vgko5mna/image/upload/v1792596314/logo-color-2.png',
                      alt: 'Partner organization logo',
                    },
                    {
                      src: 'https://res.cloudinary.com/vgko5mna/image/upload/v1792596315/Imagine-Her-Logo-Full-Colour-1-2.png',
                      alt: 'Imagine Her',
                    },
                  ].map(logo => (
                    <img
                      key={logo.src}
                      src={logo.src}
                      alt={logo.alt}
                      loading="lazy"
                      className="h-16 w-36 shrink-0 object-contain md:h-20 md:w-44"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Form */}
      <section id="partnership-form" className="bg-white px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-primary text-3xl font-bold mb-2 text-center">Start a Partnership</h2>
          <p className="text-brown text-center mb-8 text-sm">Fill in the form and our team will reach out within 48 hours.</p>

          {submitted ? (
            <div className="bg-peach-light rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-primary font-bold text-xl mb-2">Thank You!</h3>
              <p className="text-brown text-sm">We've received your partnership request and will be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Your Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="border border-peach-mid rounded px-4 py-2 text-brown outline-none focus:border-primary text-sm" />
                <input required placeholder="Organisation Name" value={form.org} onChange={e => setForm({ ...form, org: e.target.value })}
                  className="border border-peach-mid rounded px-4 py-2 text-brown outline-none focus:border-primary text-sm" />
                <input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="border border-peach-mid rounded px-4 py-2 text-brown outline-none focus:border-primary text-sm" />
                <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="border border-peach-mid rounded px-4 py-2 text-brown outline-none focus:border-primary text-sm" />
              </div>
              <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full border border-peach-mid rounded px-4 py-2 text-brown outline-none focus:border-primary text-sm">
                <option value="">Partnership Type</option>
                {partnerTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea rows={4} required placeholder="Tell us about your partnership idea..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full border border-peach-mid rounded px-4 py-2 text-brown outline-none focus:border-primary text-sm resize-none" />
              <button type="submit" className="w-full bg-primary text-white py-3 rounded font-semibold hover:opacity-90 transition-opacity">
                Submit Partnership Request
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
