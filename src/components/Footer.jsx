import { Link } from 'react-router-dom'
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaXTwitter } from 'react-icons/fa6'
import { LuArrowUpRight } from 'react-icons/lu'

const menuLinks = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Partner With Us', to: '/partner' },
  { label: 'Wholesale', to: '/wholesale' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Newsletter', to: '/newsletter' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms and Conditions', to: '/terms-and-conditions' },
  { label: 'Cookie Policy', to: '/cookies' },
]

export default function Footer() {
  return (
    <footer>
      {/* Wave divider */}
      <div className="bg-white">
        <svg viewBox="0 0 1440 80" className="w-full block" preserveAspectRatio="none">
          <path className="fill-primary" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>

      <div className="bg-primary text-white pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo */}
          <div className="flex flex-col items-start gap-2">
            <img src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792498215/Legacy_logo.png" alt="Legacy Coffee" className="h-24 w-auto brightness-0 invert md:h-28" />
          </div>

          {/* Menu */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-3">Menu</h4>
            <ul className="space-y-1">
              {menuLinks.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-white/80 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="min-w-0">
            <h4 className="text-white font-semibold text-lg mb-3">Contact</h4>
            <p className="text-white/80 text-sm mb-1">Address: Butiiti, Kyenjojo District, Uganda</p>
            <a href="mailto:info@legacycoffee.org" className="text-white text-sm hover:underline block mb-1">
              info@legacycoffee.org
            </a>
            <p className="text-white/80 text-sm mb-4">+256 752 254 962</p>

            {/* Social Icons */}
            <div className="flex gap-3 text-white text-xl mb-4">
              <a href="#" aria-label="Facebook"><FaFacebook /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
              <a href="#" aria-label="YouTube"><FaYoutube /></a>
              <a href="#" aria-label="X"><FaXTwitter /></a>
            </div>

          </div>

          <div className="min-w-0">
            <h4 className="mb-3 text-lg font-semibold text-white">Find us</h4>
            <div className="overflow-hidden border border-white/25 bg-white/10 shadow-sm">
              <div className="px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">Legacy Coffee</p>
                <p className="mt-0.5 text-sm font-medium leading-5 text-white">Butiiti, Kyenjojo District, Uganda</p>
              </div>
              <div className="relative h-40 overflow-hidden border-y border-white/20 bg-white/10">
                <iframe
                  title="Map showing Legacy Coffee in Butiiti, Kyenjojo District"
                  src="https://maps.google.com/maps?q=Butiiti%2C%20Kyenjojo%20District%2C%20Uganda%400.253744,32.562862&z=15&output=embed"
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-full">
                  <span className="block whitespace-nowrap border border-[#593a27] bg-white px-2.5 py-1 text-[11px] font-bold text-[#40291d] shadow-md">
                    Legacy Coffee
                  </span>
                  <span aria-hidden="true" className="mx-auto block h-3 w-3 rotate-45 border-b border-r border-[#593a27] bg-white" />
                </div>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=0.253744%2C32.562862"
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center justify-between gap-2 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Get directions
                <LuArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/20 px-4 pt-4 text-center text-xs text-white/60">
          <p>© {new Date().getFullYear()} Legacy Coffee Uganda. All rights reserved.</p>
          <p className="mt-2">
            Developed by{' '}
            <a href="tel:+256794448439" className="font-semibold text-white/85 hover:text-white hover:underline">+256794448439</a>
            {', '}
            <a href="tel:+25794448750" className="font-semibold text-white/85 hover:text-white hover:underline">+25794448750</a>
            {' and '}
            <a href="tel:+256785688921" className="font-semibold text-white/85 hover:text-white hover:underline">+256785688921</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
