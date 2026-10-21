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

function HeroSlider() {
  const [current, setCurrent] = useState(0)

  // auto-play — never cleared, always loops
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // manual nav just sets the index; auto-play continues from wherever it is
  const goTo = (i) => setCurrent(i)

  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      {/* slides */}
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

      {/* warm brand overlay — peach-to-brown gradient */}
      <div className="absolute inset-0 z-20"
        style={{ background: 'linear-gradient(135deg, rgba(92,58,30,0.72) 0%, rgba(245,166,35,0.18) 60%, rgba(92,58,30,0.55) 100%)' }}
      />

      {/* content — static, same across all slides */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-4 md:px-6 text-center">
        <p className="text-primary font-bold text-xs md:text-sm uppercase tracking-[0.25em] mb-3 md:mb-4"
          style={{ animation: 'fadeUp 0.7s ease both' }}>
          Legacy Coffee
        </p>

        <h1 className="text-white font-black leading-[1.1] mb-4 md:mb-5"
          style={{ fontSize: 'clamp(1.8rem, 6vw, 5rem)', animation: 'fadeUp 0.8s 0.1s ease both' }}>
          Empowering Farmers.<br />
          <span className="text-primary">Enriching Communities.</span>
        </h1>

        <p className="text-white/80 text-sm md:text-lg max-w-2xl mb-8 md:mb-10 leading-relaxed px-2"
          style={{ animation: 'fadeUp 0.8s 0.2s ease both' }}>
          We specialize in producing high-quality, sustainably grown coffee while empowering smallholder farmers, youth, and women.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center w-full max-w-xs sm:max-w-none"
          style={{ animation: 'fadeUp 0.8s 0.3s ease both' }}>
          <Link to="/shop"
            className="bg-primary text-white px-7 md:px-9 py-3.5 md:py-4 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-white hover:text-brown transition-all duration-300 shadow-lg shadow-primary/40">
            Shop Coffee →
          </Link>
          <Link to="/about"
            className="border-2 border-white/50 text-white px-7 md:px-9 py-3.5 md:py-4 rounded-full font-bold text-sm uppercase tracking-wider hover:border-primary hover:text-primary transition-all duration-300 backdrop-blur-sm">
            Our Story
          </Link>
        </div>
      </div>

    </section>
  )
}

export default function Home() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <HeroSlider />

      {/* ── LEGACY COFFEE INTRO ─────────────────────────────── */}
      <section className="bg-white px-6 py-14 md:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-5 text-3xl font-black leading-tight text-brown md:text-4xl">
            Legacy Coffee
          </h2>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-brown/75 md:text-lg">
            Legacy Coffee was founded out of a passion for both great coffee and community transformation. Rooted in the fertile soils of Western Uganda, our journey began as a family effort to uplift farmers who struggled to earn fair returns from their harvests. Today, we combine tradition, innovation, and social impact to create coffee that not only delights but also empowers.
          </p>
          <Link
            to="/about"
            className="mt-7 inline-flex items-center rounded-full bg-primary px-7 py-3 font-semibold text-white transition-colors hover:bg-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Read More
          </Link>
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
      <section className="relative bg-peach-light py-16 md:py-14 px-5 md:px-8 overflow-hidden">
        <div className="absolute -top-36 -left-36 w-80 h-80 rounded-full border-2 border-peach-mid/60" />
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full"
          style={{ background: '#C4581A' }} />
        <div className="absolute -bottom-36 -right-36 w-80 h-80 rounded-full border-2 border-peach-mid/60" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full"
          style={{ background: '#C4581A' }} />
        <div className="max-w-[1380px] mx-auto relative z-10">

          {/* section header */}
          <div className="text-center mb-8 md:mb-7">
            <p className="text-brown text-xs md:text-sm font-medium uppercase tracking-[0.42em] mb-4">Our Impact</p>
            <div className="w-12 h-[3px] bg-primary mx-auto mb-3" />
            <h2 className="text-brown font-black leading-tight mb-2" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontFamily: 'Playfair Display, serif' }}>
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
                <h3 className="text-[#E5A547] font-bold leading-[1.04] mb-4" style={{ fontSize: 'clamp(1.8rem, 2.4vw, 2.4rem)', fontFamily: 'Playfair Display, serif' }}>
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
                <h3 className="text-white font-bold leading-[1.04] mb-4" style={{ fontSize: 'clamp(1.8rem, 2.4vw, 2.4rem)', fontFamily: 'Playfair Display, serif' }}>
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
                <h3 className="text-[#A95720] font-bold leading-[1.04] mb-4" style={{ fontSize: 'clamp(1.8rem, 2.4vw, 2.4rem)', fontFamily: 'Playfair Display, serif' }}>
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
          <div className="text-center mb-16">
            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">What We Do</p>
            <h2 className="text-brown text-4xl md:text-5xl font-black leading-tight">
              Impact beyond<br />the cup.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Farmer Empowerment', body: 'Training in sustainable practices, quality control, and financial literacy — giving farmers the tools to thrive.', bg: 'bg-brown', text: 'text-white', sub: 'text-white/60' },
              { num: '02', title: 'Youth & Women Inclusion', body: 'Mentorship, income opportunities, and skills training that open doors for young people and women in the coffee chain.', bg: 'bg-primary', text: 'text-white', sub: 'text-white/70' },
              { num: '03', title: 'Environmental Restoration', body: "Tree planting and wetland restoration projects that protect Uganda's environment for future generations.", bg: 'bg-white', text: 'text-brown', sub: 'text-brown/60' },
            ].map(card => (
              <div key={card.num} className={`${card.bg} rounded-3xl p-8 relative overflow-hidden`}>
                <p className={`absolute -top-4 -right-2 text-9xl font-black opacity-[0.07] ${card.text}`}>{card.num}</p>
                <p className={`text-5xl font-black mb-6 ${card.text} opacity-20`}>{card.num}</p>
                <h3 className={`text-xl font-black mb-3 ${card.text}`}>{card.title}</h3>
                <p className={`text-sm leading-relaxed ${card.sub}`}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NUMBERS ──────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-brown">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-16 text-center">Our Impact in Numbers</p>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/10">
            {[
              { value: 100, suffix: '+', label: 'Farmers Supported' },
              { value: 50000, suffix: '+', label: 'Kg Coffee Produced' },
              { value: 5, suffix: '', label: 'Districts Covered' },
              { value: 200, suffix: '+', label: 'Women Empowered' },
            ].map(s => (
              <div key={s.label} className="py-10 px-6 text-center">
                <p className="text-5xl md:text-6xl font-black text-primary mb-3">
                  <CountUp target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-peach-light/60 text-xs uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR COFFEE ───────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
            <div>
              <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">Farm to Cup</p>
              <h2 className="text-brown text-4xl md:text-5xl font-black leading-tight">Our Coffee</h2>
            </div>
            <Link to="/shop" className="text-brown/50 text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* feature card */}
            <div className="relative rounded-3xl overflow-hidden h-[460px] group">
              <img src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800"
                alt="Arabica" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-brown/85 via-brown/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">Single Origin</span>
                <h3 className="text-white text-2xl font-black mt-3 mb-2">Arabica Highlands</h3>
                <p className="text-white/70 text-sm mb-5">Light roast with fruity notes from the Kyenjojo highlands.</p>
                <Link to="/shop" className="inline-block bg-white text-brown text-sm font-bold px-6 py-2.5 rounded-full hover:bg-primary hover:text-white transition-all">
                  Shop Now →
                </Link>
              </div>
            </div>

            {/* stacked right */}
            <div className="flex flex-col gap-6">
              <div className="relative rounded-3xl overflow-hidden h-52 group">
                <img src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792507268/coffee-bean-bag-with-eucalyptus-roasted-coffee-scaled.png"
                  alt="Robusta" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-brown/75 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-8">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-3">Bold Blend</span>
                  <h3 className="text-white text-xl font-black">Robusta Espresso</h3>
                  <Link to="/shop" className="text-primary text-sm font-bold mt-2 hover:text-white transition-colors">Shop Now →</Link>
                </div>
              </div>

              <div className="bg-peach-light rounded-3xl p-8 flex flex-col justify-between flex-1">
                <div>
                  <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Bulk & Export</p>
                  <h3 className="text-brown text-xl font-black leading-tight mb-2">Premium Export Grade Green Beans</h3>
                  <p className="text-brown/60 text-sm">Direct from farmers. Traceable. Certified.</p>
                </div>
                <Link to="/shop#quote"
                  className="self-start mt-6 bg-brown text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-primary transition-all">
                  Get a Quote →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="relative py-28 px-6 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600"
          alt="bg" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-brown/75" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4">Partner With Us</p>
          <h2 className="text-white text-4xl md:text-6xl font-black leading-tight mb-6">
            Every cup you buy<br />
            <span className="text-primary">changes a life.</span>
          </h2>
          <p className="text-peach-light/70 text-base mb-10 max-w-xl mx-auto">
            Whether you're a café, hotel, NGO, or individual — join us in building a fairer coffee industry in Uganda.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/shop"
              className="bg-primary text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-white hover:text-brown transition-all shadow-lg shadow-primary/30">
              Shop Now
            </Link>
            <Link to="/partner"
              className="border-2 border-peach-light/40 text-peach-light px-10 py-4 rounded-full font-bold text-sm uppercase tracking-wider hover:border-primary hover:text-primary transition-all">
              Become a Partner
            </Link>
          </div>
        </div>
      </section>

      {/* ── PARTNERS ─────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-peach-light">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-brown/50 text-xs font-bold uppercase tracking-[0.2em] mb-12">Trusted Partners & Supporters</p>
          <div className="overflow-hidden">
            <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap items-center gap-16">
              {[...Array(2)].flatMap((_, i) =>
                ['KCCA', 'ImagineHer', 'Tony Elumelu Foundation', 'YonderLife', 'CURAP', 'UNFCU Foundation'].map((p, j) => (
                  <span key={`${i}-${j}`}
                    className="text-brown/40 font-black text-lg uppercase tracking-widest hover:text-primary transition-colors cursor-default flex-shrink-0">
                    {p}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
