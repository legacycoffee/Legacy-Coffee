import { Link } from 'react-router-dom'

export default function LegalPageLayout({ title, introduction, sections }) {
  return (
    <article className="min-h-[60vh] bg-[#fffdfa] px-4 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Legacy Coffee Uganda</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brown sm:text-4xl">{title}</h1>
        {introduction && <p className="mt-4 max-w-3xl text-sm leading-7 text-brown/75">{introduction}</p>}
        <p className="mt-3 text-xs text-brown/55">Last updated: 28 October 2026</p>

        <div className="mt-8 space-y-7">
          {sections.map(section => (
            <section key={section.heading} className="border-t border-peach-mid/50 pt-5">
              <h2 className="text-lg font-bold text-brown">{section.heading}</h2>
              {section.paragraphs?.map(paragraph => (
                <p key={paragraph} className="mt-2 text-sm leading-7 text-brown/75">{paragraph}</p>
              ))}
              {section.items && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-brown/75">
                  {section.items.map(item => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>

        <p className="mt-8 border-t border-peach-mid/50 pt-5 text-sm leading-6 text-brown/75">
          Questions? <Link to="/contact" className="font-semibold text-[#70432d] underline underline-offset-2">Contact Legacy Coffee</Link> or email{' '}
          <a href="mailto:info@legacycoffee.org" className="font-semibold text-[#70432d] underline underline-offset-2">info@legacycoffee.org</a>.
        </p>
      </div>
    </article>
  )
}
