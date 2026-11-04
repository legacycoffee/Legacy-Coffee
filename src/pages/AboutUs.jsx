import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

function CountUp({ target, suffix }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const steps = 60
        const inc = target / steps
        let cur = 0
        const t = setInterval(() => {
          cur += inc
          if (cur >= target) { setCount(target); clearInterval(t) }
          else setCount(Math.floor(cur))
        }, 2000 / steps)
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

const slides = [
  { img: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600', pos: 'center' },
  { img: 'https://res.cloudinary.com/adfm8lvp/image/upload/v1792507268/coffee-bean-bag-with-eucalyptus-roasted-coffee-scaled.png', pos: 'center 30%', fit: 'contain' },
  { img: 'https://res.cloudinary.com/adfm8lvp/image/upload/v1792508243/coffee_farm.jpg', pos: 'center' },
  { img: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1600', pos: 'center' },
  { img: 'https://res.cloudinary.com/vgko5mna/image/upload/v1792514667/coffee_1_farm.jpg', pos: 'center' },
]

const partnerTypes = ['NGO / Donor', 'Restaurant / Hotel', 'Exporter / Importer', 'Corporate Gifting', 'Community Project', 'Other']

const partnerLogos = [
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
]

function HeroSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={slide.img}
            alt="Legacy Coffee"
            className={`w-full h-full transition-transform duration-[8000ms] ease-linear ${
              i === current ? 'scale-110' : 'scale-100'
            }`}
            style={{ objectFit: slide.fit || 'cover', objectPosition: slide.pos }}
          />
        </div>
      ))}

      <div
        className="absolute inset-0 z-20"
        style={{ background: 'linear-gradient(135deg, rgba(92,58,30,0.72) 0%, rgba(245,166,35,0.18) 60%, rgba(92,58,30,0.55) 100%)' }}
      />

      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-4 text-center md:px-6">
        <p className="mb-3 text-lg font-bold uppercase tracking-[0.25em] text-primary sm:text-xl md:mb-4 md:text-2xl"
          style={{ animation: 'fadeUp 0.7s ease both' }}>
          Legacy Coffee
        </p>

        <h1 className="mb-4 font-black leading-[1.1] text-white md:mb-5"
          style={{ animation: 'fadeUp 0.8s 0.1s ease both' }}>
          Empowering Farmers.<br />
          <span className="text-primary">Enriching Communities.</span>
        </h1>

        <p className="mb-8 max-w-2xl px-2 text-sm leading-relaxed text-white/80 md:mb-10 md:text-lg"
          style={{ animation: 'fadeUp 0.8s 0.2s ease both' }}>
          We specialize in producing high-quality, sustainably grown coffee while empowering smallholder farmers, youth, and women.
        </p>

        <div className="flex w-full max-w-xs flex-col justify-center gap-3 sm:max-w-none sm:flex-row md:gap-4"
          style={{ animation: 'fadeUp 0.8s 0.3s ease both' }}>
          <Link to="/#products"
            className="rounded-full bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/40 transition-all duration-300 hover:bg-white hover:text-brown md:px-9 md:py-4">
            Shop Coffee →
          </Link>
          <Link to="/about#story"
            className="rounded-full border-2 border-white/50 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-all duration-300 hover:border-primary hover:text-primary md:px-9 md:py-4">
            Our Story
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function AboutUs() {
  const [partnershipForm, setPartnershipForm] = useState({
    name: '',
    org: '',
    email: '',
    phone: '',
    type: '',
    message: '',
  })
  const [partnershipSubmitted, setPartnershipSubmitted] = useState(false)

  const handlePartnershipSubmit = event => {
    event.preventDefault()
    setPartnershipSubmitted(true)
  }

  return (
    <div className="home-page overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <HeroSlider />

      {/* ── LEGACY COFFEE INTRO ─────────────────────────────── */}
      <section className="bg-white px-6 py-14 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-5 text-center text-3xl font-black leading-tight text-brown md:text-4xl">
            Legacy Coffee
          </h2>
          <p className="mx-auto max-w-3xl text-justify text-base leading-relaxed text-brown/75 md:text-lg">
            Legacy Coffee was founded out of a passion for both great coffee and community transformation. Rooted in the fertile soils of Western Uganda, our journey began as a family effort to uplift farmers who struggled to earn fair returns from their harvests. Today, we combine tradition, innovation, and social impact to create coffee that not only delights but also empowers.
          </p>
          <div className="mx-auto mt-5 max-w-3xl space-y-4 text-justify text-base leading-relaxed text-brown/75 md:text-lg">
            <p className="w-full">
              At Legacy Coffee, our mission is to redefine the coffee value chain in Uganda, starting in the Rwenzori region. While Uganda produces premium coffee, its quality often suffers due to broken value chains and one-off transactions between buyers and farmers, leading to high price volatility and unreliable markets.
            </p>
            <p className="w-full">
              Our model is different. With more than 90% of Ugandan coffee farmers being smallholders, we bring them together in a cooperative setting. This approach allows us to equip them with advanced post-harvest processing techniques at the farm level. By fostering a relationship-based supply chain, we ensure consistent pricing and a stable market for over 1,000 smallholder coffee producers. This commitment to transparency, traceability, and relationship-based trade gives us greater control over quality, while giving farmers price stability through long-term contracts and reduced vulnerability to market speculation.
            </p>
          </div>
          <div className="mt-7 text-center">
            <Link
              to="/#products"
              className="inline-flex items-center rounded-full bg-primary px-7 py-3 font-semibold text-white transition-colors hover:bg-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Explore Our Coffee
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE STRIP ────────────────────────────────────── */}
      <div className="bg-brown py-4 overflow-hidden">
        <div className="marquee-strip flex whitespace-nowrap">
          {[...Array(4)].flatMap((_, i) =>
            ['Sustainably Grown', 'Fair Trade', 'Western Uganda', 'Empowering Farmers', 'Premium Quality', 'Community First', 'Single Origin'].map((w, j) => (
              <span key={`${i}-${j}`} className="text-peach-light font-bold text-sm uppercase tracking-widest mx-8 flex-shrink-0">
                {w}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── ABOUT ───────────────────────────────────────────── */}
      <section id="story" className="relative bg-peach-light py-16 md:py-14 px-5 md:px-8 overflow-hidden">
        <div className="absolute -top-36 -left-36 w-80 h-80 rounded-full border-2 border-peach-mid/60" />
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full"
          style={{ background: '#C4581A' }} />
        <div className="absolute -bottom-36 -right-36 w-80 h-80 rounded-full border-2 border-peach-mid/60" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full"
          style={{ background: '#C4581A' }} />
        <div className="max-w-[1380px] mx-auto relative z-10">

          {/* section header */}
          <div className="text-center mb-8 md:mb-7">
            <h2 className="text-brown font-black leading-tight mb-2">
              From Farm to Future
            </h2>
            <p className="text-brown/80 text-base md:text-xl max-w-3xl mx-auto leading-relaxed">
              We work across the entire coffee value chain — supporting farmers, improving quality, and creating sustainable opportunities.
            </p>
          </div>

          {/* cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">

            {/* MISSION */}
            <div className="group relative">
              <div className="relative overflow-hidden flex flex-col min-h-[280px] transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-2 motion-safe:group-hover:rotate-[1deg] motion-reduce:transition-none"
                style={{ background: '#351a08', borderRadius: '38px 54px 48px 44px', boxShadow: '0 22px 48px rgba(75,42,16,0.25)' }}>
              <div className="relative z-10 p-7 md:p-7 xl:p-9 flex flex-col h-full">
                <h3 className="text-white font-bold leading-[1.04] mb-4">
                  Mission
                </h3>
                <p className="text-white/80 text-base font-light md:text-lg leading-[1.5] max-w-[290px]">
                  To deliver premium-quality roasted coffee through sustainable farming practices &amp; fair trade to empower the community that grows the coffee.
                </p>
              </div>
              </div>
            </div>

            {/* CORE VALUES */}
            <div className="group relative">
              <div className="relative overflow-hidden flex flex-col min-h-[280px] transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-2 motion-safe:group-hover:-rotate-[1deg] motion-reduce:transition-none"
                style={{ background: 'linear-gradient(135deg, #D94D08 0%, #F17816 100%)', borderRadius: '42px 100px 40px 44px', boxShadow: '0 22px 48px rgba(163,77,23,0.22)' }}>
              <div className="relative z-10 p-7 md:p-7 xl:p-9 flex flex-col h-full">
                <h3 className="text-white font-bold leading-[1.04] mb-4">
                  Core Values
                </h3>
                <p className="text-white text-base md:text-lg leading-[1.5] max-w-[290px]">
                  Quality | Fairness | Integrity | Sustainability | Empowerment
                </p>
              </div>
              </div>
            </div>

            {/* VISION */}
            <div className="group relative">
              <div className="relative overflow-hidden flex flex-col min-h-[280px] transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-2 motion-safe:group-hover:rotate-[1deg] motion-reduce:transition-none"
                style={{ background: 'linear-gradient(135deg, #FFF9ED 0%, #FAF1E1 100%)', borderRadius: '44px 84px 46px 42px', boxShadow: '0 22px 48px rgba(92,58,30,0.14)' }}>
              <div className="relative z-10 p-7 md:p-7 xl:p-9 flex flex-col h-full">
                <h3 className="text-[#A95720] font-bold leading-[1.04] mb-4">
                  Vision
                </h3>
                <p className="text-[#2C1A0E]/80 text-base md:text-lg leading-[1.5] max-w-[290px]">
                  A thriving coffee industry in Uganda where farmers, youth, and women enjoy prosperity, dignity, opportunity, serve roasted fine robusta and speciality arabica coffee world wide.
                </p>
              </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── IMPACT ───────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-peach-light">
        <div className="max-w-6xl mx-auto">
          <h2 className="mb-12 text-center text-brown text-4xl md:text-5xl font-black leading-tight">
            Impact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-brown/15 md:divide-y-0 md:divide-x">
            {[
              {
                title: 'Farmer Empowerment',
                body: 'We work hand-in-hand with local farmers, providing training in sustainable practices, quality control, and financial literacy.',
              },
              {
                title: 'Youth & Women Inclusion',
                body: 'By offering training, mentorship, and income opportunities, we empower young people and women to thrive in the coffee value chain.',
              },
              {
                title: 'Environmental Restoration',
                body: 'Our commitment to nature includes tree planting and wetland restoration projects to safeguard Uganda’s environment for future generations.',
              },
            ].map((item, index) => (
              <article
                key={item.title}
                className={`group py-7 md:px-8 md:py-2 ${index === 0 ? 'md:pl-0' : ''} ${index === 2 ? 'md:pr-0' : ''}`}
              >
                <div>
                  <h3 className="mb-2 text-xl font-bold text-brown md:text-2xl">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-brown/70 md:text-base">{item.body}</p>
                </div>
              </article>
            ))}
          </div>

        </div>
      </section>

      {/* ── NUMBERS ──────────────────────────────────────────── */}
      <section className="py-5 md:py-6 px-6 bg-brown">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3 text-center">Our Impact in Numbers</p>
          <div className="mx-auto grid max-w-2xl grid-cols-1 sm:grid-cols-2">
            {[
              { value: 100, suffix: '', label: 'Farmers equipped with modern skills' },
              { value: 50000, suffix: '', label: 'Coffee trees planted in Kyenjojo' },
            ].map(s => (
              <div key={s.label} className="py-2 px-3 md:px-5 text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">
                  <CountUp target={s.value} suffix={s.suffix} />
                </div>
                <p className="text-peach-light/60 text-xs uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERSHIP ─────────────────────────────────────── */}
      <section id="partnership" className="bg-white px-6 pt-16 pb-8 md:pt-20 md:pb-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-black text-brown md:text-4xl">Partner With Us</h2>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-brown/75 md:text-lg">
            We welcome collaborations with NGOs, restaurants, hotels, exporters, and institutions. Whether through bulk orders, corporate gifting, or joint community projects, together we can make a difference
          </p>
        </div>

        <details id="partnership-form" className="mx-auto mt-12 max-w-2xl scroll-mt-24 text-center">
          <summary className="mx-auto inline-flex min-h-12 cursor-pointer list-none items-center justify-center rounded-full bg-primary px-7 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Start a Partnership
          </summary>
          <p className="mb-8 text-center text-sm text-brown">Fill in the form and our team will reach out within 48 hours.</p>

          {partnershipSubmitted ? (
            <div className="rounded-xl bg-peach-light p-8 text-center">
              <div className="mb-4 text-5xl">🎉</div>
              <h4 className="mb-2 text-xl font-bold text-primary">Thank You!</h4>
              <p className="text-sm text-brown">We've received your partnership request and will be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handlePartnershipSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input required placeholder="Your Name" value={partnershipForm.name} onChange={event => setPartnershipForm({ ...partnershipForm, name: event.target.value })}
                  className="rounded border border-peach-mid px-4 py-2 text-sm text-brown outline-none focus:border-primary" />
                <input required placeholder="Organisation Name" value={partnershipForm.org} onChange={event => setPartnershipForm({ ...partnershipForm, org: event.target.value })}
                  className="rounded border border-peach-mid px-4 py-2 text-sm text-brown outline-none focus:border-primary" />
                <input required type="email" placeholder="Email Address" value={partnershipForm.email} onChange={event => setPartnershipForm({ ...partnershipForm, email: event.target.value })}
                  className="rounded border border-peach-mid px-4 py-2 text-sm text-brown outline-none focus:border-primary" />
                <input placeholder="Phone Number" value={partnershipForm.phone} onChange={event => setPartnershipForm({ ...partnershipForm, phone: event.target.value })}
                  className="rounded border border-peach-mid px-4 py-2 text-sm text-brown outline-none focus:border-primary" />
              </div>
              <select required value={partnershipForm.type} onChange={event => setPartnershipForm({ ...partnershipForm, type: event.target.value })}
                className="w-full rounded border border-peach-mid px-4 py-2 text-sm text-brown outline-none focus:border-primary">
                <option value="">Partnership Type</option>
                {partnerTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <textarea rows={4} required placeholder="Tell us about your partnership idea..." value={partnershipForm.message} onChange={event => setPartnershipForm({ ...partnershipForm, message: event.target.value })}
                className="w-full resize-none rounded border border-peach-mid px-4 py-2 text-sm text-brown outline-none focus:border-primary" />
              <button type="submit" className="w-full rounded bg-primary py-3 font-semibold text-white transition-opacity hover:opacity-90">
                Submit Partnership Request
              </button>
            </form>
          )}
        </details>
      </section>

      <section className="bg-white px-6 pt-8 md:pt-10">
        <h2 className="text-center text-3xl font-black text-brown md:text-4xl">Our Partners</h2>
      </section>

      <section id="partnerships" className="overflow-hidden bg-peach-light px-6 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden">
            <div className="partner-logo-track flex w-max items-center">
              {[0, 1].map(copy => (
                <div key={copy} className="flex shrink-0 items-center gap-16 pr-16" aria-hidden={copy === 1}>
                  {partnerLogos.map(logo => (
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

    </div>
  )
}
