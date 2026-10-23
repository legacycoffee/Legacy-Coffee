import { useState } from 'react'
import { FiMapPin, FiMail, FiPhone } from 'react-icons/fi'

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = e => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate flex min-h-[320px] items-center justify-center overflow-hidden px-6 py-20 text-center">
        <img
          src="https://res.cloudinary.com/vgko5mna/image/upload/v1792767454/contact_image.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-brown/55" />
        <div className="relative">
          <h1 className="mb-4 text-4xl font-bold text-white">Contact Us</h1>
          <p className="mx-auto max-w-xl text-white/90">We'd love to hear from you. Reach out for any inquiries, orders, or collaborations.</p>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-primary text-2xl font-bold mb-6">Get In Touch</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <FiMapPin className="text-primary mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-brown font-semibold">Address</p>
                  <p className="text-brown/80 text-sm">Butiiti, Kyenjojo District, Uganda</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <FiMail className="text-primary mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-brown font-semibold">Email</p>
                  <a href="mailto:info@legacycoffee.org" className="text-primary text-sm hover:underline">info@legacycoffee.org</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <FiPhone className="text-primary mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-brown font-semibold">Phone</p>
                  <p className="text-brown/80 text-sm">+256 752 254 962</p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="mt-8 rounded-xl overflow-hidden shadow">
              <iframe
                title="Legacy Coffee Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127672!2d30.6!3d0.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177d5b9b0b0b0b0b%3A0x0!2sKyenjojo%20District%2C%20Uganda!5e0!3m2!1sen!2sug!4v1"
                width="100%"
                height="250"
                className="border-0"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-primary text-2xl font-bold mb-6">Send a Message</h2>
            {submitted ? (
              <div className="bg-peach-light rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-primary font-bold text-xl mb-2">Message Sent!</h3>
                <p className="text-brown text-sm">We'll respond within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="Your Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-peach-mid rounded px-4 py-2 text-brown outline-none focus:border-primary text-sm" />
                <input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-peach-mid rounded px-4 py-2 text-brown outline-none focus:border-primary text-sm" />
                <input required placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full border border-peach-mid rounded px-4 py-2 text-brown outline-none focus:border-primary text-sm" />
                <textarea required rows={5} placeholder="Your message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-peach-mid rounded px-4 py-2 text-brown outline-none focus:border-primary text-sm resize-none" />
                <button type="submit" className="w-full bg-primary text-white py-3 rounded font-semibold hover:opacity-90 transition-opacity">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
