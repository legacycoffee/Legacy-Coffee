import { Link } from 'react-router-dom'

export default function PatrickStoryPage() {
  return (
    <div className="bg-[#fffdfa] px-6 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/about"
          className="inline-flex items-center gap-2 rounded-full border border-peach-mid bg-white px-4 py-2 text-sm font-semibold text-brown transition-colors hover:border-primary hover:text-primary"
        >
          ← Back to About Us
        </Link>

        <article className="mt-8 rounded-[32px] border border-peach-mid/50 bg-white p-6 shadow-sm md:p-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-primary">
            Farmer Story
          </p>
          <h1 className="max-w-4xl text-3xl font-black leading-tight text-brown md:text-5xl">
            Patrick Muhereza is Elevating Uganda’s Robusta Coffee
          </h1>

          <div className="mt-8 space-y-6 text-base leading-relaxed text-brown/80 md:text-lg">
            <p>
              Patrick Muhereza is one of the many farmers showing that Uganda’s Robusta can compete on quality, value, and global recognition when it is backed by training, trust, and sustainable practice.
            </p>
            <p>
              Before joining the Legacy Coffee network, Patrick worked with the realities most smallholder farmers know well: inconsistent prices, limited market access, and little room to invest in better processing or expansion. Like many producers in the region, he had the skill and the land, but not the systems to turn that potential into a stable income.
            </p>
            <p>
              Through hands-on training, mentorship, and a direct path to fair demand, Patrick began transforming his farm. He adopted better post-harvest handling, improved drying practices, and a more disciplined approach to quality control. These changes did not just improve the cup profile of his coffee — they created a stronger foundation for his household, his farm, and his future.
            </p>
            <p>
              Today, Patrick is proving that Uganda’s Robusta has a powerful role to play in the global coffee story. By producing coffee that is traceable, consistent, and premium in quality, he is helping to shift the market away from volume alone and toward value, fairness, and long-term impact.
            </p>
            <p>
              His story reflects the broader mission of Legacy Coffee: empowering farmers with practical knowledge, dependable market access, and the confidence to grow beyond subsistence into meaningful, resilient livelihoods.
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
