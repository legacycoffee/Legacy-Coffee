import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useCookieConsent } from '../context/useCookieConsent.js'

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

const coffeeBackgroundImages = [
  'https://res.cloudinary.com/vgko5mna/image/upload/v1792589717/coffee_3.jpg',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1792589718/coffee_1.jpg',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1792589718/coffee_5.jpg',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1792589718/coffee_4.jpg',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1792589717/coffee_2.jpg',
  'https://res.cloudinary.com/vgko5mna/image/upload/v1792514667/coffee_1_farm.jpg',
]

const slides = [
  { img: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600', pos: 'center' },
  { img: 'https://res.cloudinary.com/adfm8lvp/image/upload/v1792507268/coffee-bean-bag-with-eucalyptus-roasted-coffee-scaled.png', pos: 'center 30%', fit: 'contain' },
  { img: 'https://res.cloudinary.com/adfm8lvp/image/upload/v1792508243/coffee_farm.jpg', pos: 'center' },
  { img: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1600', pos: 'center' },
  { img: 'https://res.cloudinary.com/vgko5mna/image/upload/v1792514667/coffee_1_farm.jpg', pos: 'center' },
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

function OurCoffeeSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % coffeeBackgroundImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative isolate overflow-hidden bg-white px-6 py-16 md:py-20">
      {coffeeBackgroundImages.map((image, index) => (
        <img
          key={image}
          src={image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-1000 ${index === current ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectPosition: 'center 75%' }}
        />
      ))}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10"
        style={{ background: 'linear-gradient(135deg, rgba(92,58,30,0.72) 0%, rgba(245,166,35,0.18) 60%, rgba(92,58,30,0.55) 100%)' }}
      />
      <div className="relative z-20 mx-auto max-w-6xl text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-4xl font-black leading-tight text-primary md:text-5xl">
            Our Coffee
          </h2>
          <p className="text-base font-bold leading-relaxed text-white md:text-lg">
            Uganda’s rich soils and high-altitude climate create the perfect conditions for exceptional coffee. Legacy Coffee sources directly from smallholder farmers in Kyenjojo, Kabarole, Bunyangabu and surrounding areas, ensuring freshness, traceability, and quality.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:mt-14 md:grid-cols-2 md:gap-14">
          <div>
            <h3 className="mb-3 text-xl font-bold text-primary md:text-2xl">Processing &amp; Roasting</h3>
            <p className="text-sm font-bold leading-relaxed text-white md:text-base">
              From hand-picking ripe cherries to careful washing, drying, and roasting, our process preserves natural flavors and guarantees consistency.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-xl font-bold uppercase tracking-wide text-primary md:text-2xl">Flavor Notes</h3>
            <p className="text-sm font-bold leading-relaxed text-white md:text-base">
              Rich, smooth body with hints of chocolate, nutty undertones, and a bright, clean finish
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AboutUs() {
  const { consent, openPreferences } = useCookieConsent()
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#patrick-story') {
      document.getElementById('patrick-story')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location.hash])

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
          <p className="mx-auto max-w-3xl text-left text-base leading-relaxed text-brown/75 md:text-lg">
            Legacy Coffee was founded out of a passion for both great coffee and community transformation. Rooted in the fertile soils of Western Uganda, our journey began as a family effort to uplift farmers who struggled to earn fair returns from their harvests. Today, we combine tradition, innovation, and social impact to create coffee that not only delights but also empowers.
          </p>
          <div className="mx-auto mt-5 max-w-3xl space-y-4 text-left text-base leading-relaxed text-brown/75 md:text-lg">
            <p className="w-full text-left">
              At Legacy Coffee, our mission is to redefine the coffee value chain in Uganda, starting in the Rwenzori region. While Uganda produces premium coffee, its quality often suffers due to broken value chains and one-off transactions between buyers and farmers, leading to high price volatility and unreliable markets.
            </p>
            <p className="w-full text-left">
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

            {/* MISSION — dark espresso */}
            <div className="group relative">
              <div className="relative overflow-hidden flex flex-col min-h-[280px] transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-2 motion-safe:group-hover:rotate-[1deg] motion-reduce:transition-none"
                style={{ background: 'linear-gradient(135deg, #351a08 0%, #48240e 100%)', border: '1px solid rgba(245, 200, 150, 0.7)', borderRadius: '38px 54px 48px 44px', boxShadow: '0 22px 48px rgba(75,42,16,0.25)' }}>
              {/* large peach organic blob — bottom-right corner */}
              <svg className="absolute bottom-0 right-0 w-[68%] h-[58%] transition-transform duration-700 ease-out motion-safe:group-hover:scale-110 motion-safe:group-hover:-translate-x-2 motion-reduce:transition-none" viewBox="0 0 260 260" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#E8B07A" d="M260,260 L80,260 C80,260 20,250 10,200 C0,150 30,110 70,90 C110,70 160,80 200,60 C240,40 260,0 260,0 Z" />
              </svg>
              {/* second lighter blob on top */}
              <svg className="absolute bottom-0 right-0 w-[52%] h-[46%]" viewBox="0 0 200 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#F5C896" d="M200,200 L60,200 C60,200 10,188 5,148 C0,108 28,78 65,62 C102,46 148,58 175,38 C202,18 200,0 200,0 Z" />
              </svg>
              {/* thin gold curved line over blob */}
              <svg className="absolute bottom-0 right-0 w-[68%] h-[58%]" viewBox="0 0 260 260" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" stroke="#C8922A" strokeWidth="1.5" d="M260,140 C220,155 180,170 140,185 C110,196 85,205 60,215 C40,222 20,240 0,260" />
              </svg>
              <div className="relative z-10 p-7 md:p-7 xl:p-9 flex flex-col h-full">
                <h3 className="text-[#E5A547] font-bold leading-[1.04] mb-4">
                  Mission
                </h3>
                <p className="text-white/80 text-base md:text-lg leading-[1.5] max-w-[290px]">
                  To deliver premium-quality coffee while transforming lives through fair trade, sustainable farming, and community empowerment.
                </p>
              </div>
              </div>
            </div>

            {/* CORE VALUES — burnt orange */}
            <div className="group relative">
              <div className="relative overflow-hidden flex flex-col min-h-[280px] transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-2 motion-safe:group-hover:-rotate-[1deg] motion-reduce:transition-none"
                style={{ background: 'linear-gradient(135deg, #D94D08 0%, #F17816 100%)', border: '1px solid rgba(255, 225, 180, 0.75)', borderRadius: '42px 100px 40px 44px', boxShadow: '0 22px 48px rgba(163,77,23,0.22)' }}>
              <svg className="absolute top-0 right-0 w-[48%] h-[35%] transition-transform duration-700 ease-out motion-safe:group-hover:scale-110 motion-safe:group-hover:translate-x-2 motion-reduce:transition-none" viewBox="0 0 200 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#F3A33F" fillOpacity="0.48" d="M0,0 H200 V150 C148,136 132,118 100,92 C68,66 38,20 0,0 Z" />
              </svg>
              {/* large peach organic wave — fills bottom ~45% */}
              <svg className="absolute bottom-0 left-0 w-full h-[42%]" viewBox="0 0 380 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#F7A94F" d="M0,200 L0,120 C30,95 70,140 120,118 C160,100 190,75 230,85 C270,95 310,130 380,100 L380,200 Z" />
              </svg>
              {/* second lighter wave on top */}
              <svg className="absolute bottom-0 left-0 w-full h-[34%]" viewBox="0 0 380 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFB84F" fillOpacity="0.82" d="M0,200 L0,148 C40,128 85,162 130,145 C170,130 205,108 248,118 C290,128 330,155 380,138 L380,200 Z" />
              </svg>
              <div className="relative z-10 p-7 md:p-7 xl:p-9 flex flex-col h-full">
                <h3 className="text-white font-bold leading-[1.04] mb-4">
                  Core Values
                </h3>
                <p className="text-white/85 text-base md:text-lg leading-[1.5] max-w-[290px]">
                  Quality | Fairness | Integrity | Sustainability | Empowerment
                </p>
              </div>
              </div>
            </div>

            {/* VISION — warm ivory */}
            <div className="group relative">
              <div className="relative overflow-hidden flex flex-col min-h-[280px] transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-2 motion-safe:group-hover:rotate-[1deg] motion-reduce:transition-none"
                style={{ background: 'linear-gradient(135deg, #FFF9ED 0%, #FAF1E1 100%)', border: '1px solid rgba(164, 104, 55, 0.48)', borderRadius: '44px 84px 46px 42px', boxShadow: '0 22px 48px rgba(92,58,30,0.14)' }}>
              {/* large brown/tan organic blob — bottom-right corner */}
              <svg className="absolute bottom-0 right-0 w-[62%] h-[62%] transition-transform duration-700 ease-out motion-safe:group-hover:scale-110 motion-safe:group-hover:-translate-x-2 motion-reduce:transition-none" viewBox="0 0 240 240" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#C4783A" d="M240,240 L70,240 C70,240 15,228 8,182 C0,136 32,100 72,82 C112,64 158,76 192,54 C226,32 240,0 240,0 Z" />
              </svg>
              {/* lighter peach blob on top */}
              <svg className="absolute bottom-0 right-0 w-[46%] h-[46%]" viewBox="0 0 180 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#E8A86A" fillOpacity="0.6" d="M180,180 L55,180 C55,180 12,170 6,136 C0,102 26,74 58,60 C90,46 130,54 155,36 C180,18 180,0 180,0 Z" />
              </svg>
              {/* thin brown curved stroke lines */}
              <svg className="absolute bottom-0 right-0 w-[62%] h-[62%]" viewBox="0 0 240 240" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" stroke="#7A3A18" strokeWidth="1.2" strokeOpacity="0.5" d="M240,110 C200,128 162,148 124,166 C96,180 70,192 44,206 C28,214 14,228 0,240" />
                <path fill="none" stroke="#7A3A18" strokeWidth="1" strokeOpacity="0.3" d="M240,140 C205,155 168,172 132,188 C104,200 76,212 48,224 C32,230 16,236 0,240" />
              </svg>
              <div className="relative z-10 p-7 md:p-7 xl:p-9 flex flex-col h-full">
                <h3 className="text-[#A95720] font-bold leading-[1.04] mb-4">
                  Vision
                </h3>
                <p className="text-[#2C1A0E]/80 text-base md:text-lg leading-[1.5] max-w-[290px]">
                  A thriving coffee industry in Uganda where farmers, youth, and women enjoy prosperity, dignity, and opportunity.
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

          <div id="patrick-story" className="mt-10 text-center">
            <Link
              to="/about/patrick-muhereza"
              className="inline-flex text-base font-semibold text-primary underline decoration-2 underline-offset-4 transition-colors hover:text-brown focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:text-lg"
            >
              Read How Patrick Muhereza is Elevating Uganda’s Robusta Coffee
            </Link>
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

      {/* ── OUR COFFEE ───────────────────────────────────────── */}
      <OurCoffeeSection />

      {/* ── FARMER TRANSFORMATION VIDEO ─────────────────────── */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-3xl font-black leading-tight text-brown md:text-4xl">
            Watch and hear from Patrick
          </h2>
          <div className="aspect-video overflow-hidden rounded-2xl shadow-lg">
            {consent?.embeddedContent ? (
              <iframe
                className="h-full w-full"
                src="https://www.youtube-nocookie.com/embed/_tfrzsu8rLs?vq=hd1080"
                title="How Legacy Coffee is transforming small holder farmers"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#f7f1e9] px-5 text-center">
                <p className="text-sm text-brown/75">The video is disabled until you allow optional embedded content.</p>
                <button type="button" onClick={openPreferences} className="font-semibold text-primary underline underline-offset-2">
                  Manage preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
