import { Link } from 'react-router-dom'
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaXTwitter } from 'react-icons/fa6'

const menuLinks = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Partner With Us', to: '/partner' },
  { label: 'Wholesale', to: '/wholesale' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Newsletter', to: '/newsletter' },
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

          {/* Location Map */}
          <div className="min-w-0">
            <h4 className="text-white font-semibold text-lg mb-3">Location</h4>
            <iframe
              title="Legacy Coffee Location"
              src="https://maps.google.com/maps?q=0.253744,32.562862&z=15&output=embed"
              width="100%"
              height="150"
              className="rounded border-0"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>

        <div className="text-center text-white/60 text-xs mt-6">
          © {new Date().getFullYear()} Legacy Coffee Uganda. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
