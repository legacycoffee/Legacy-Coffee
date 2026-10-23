import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function PatrickStoryPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="bg-[#fffdfa] px-6 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/about#patrick-story"
          className="inline-flex items-center gap-2 rounded-full border border-peach-mid bg-white px-4 py-2 text-sm font-semibold text-brown transition-colors hover:border-primary hover:text-primary"
        >
          ← Back to About Us
        </Link>

        <article className="mt-8">
          <h1 className="max-w-4xl text-2xl font-black leading-tight text-brown md:text-4xl">
            Patrick Muhereza is Elevating Uganda’s Robusta Coffee
          </h1>

          <img
            src="https://res.cloudinary.com/vgko5mna/image/upload/v1792754496/Pato.jpg"
            alt="Patrick Muhereza"
            className="mt-6 h-auto w-full max-w-3xl rounded-2xl object-cover"
          />

          <div className="mt-8 space-y-6 text-base leading-relaxed text-brown/80 md:text-lg">
            <p>
              In Uganda’s coffee heartland—the Rwenzori region—many smallholder farmers have long grappled with a frustrating reality: high input costs and low yields in a market that rewarded volume over value. Legacy Coffee is not just selling beans; it’s changing how coffee is grown, valued, and sold in Uganda.
            </p>
            <p>
              “Most of the coffee that was being grown by smallholders lacked inherent quality. So unless you had many bags, you couldn’t earn much,” says Patrick Muhereza, founder and Managing Director of Legacy Coffee Ltd.
            </p>
            <p>
              “People didn’t understand that if you have fewer bags of high-quality coffee, you can actually make more money than someone with lots of poor-quality beans,” Patrick adds. The result was a system that left farmers stuck in cycles of low earnings and little incentive to invest in quality.
            </p>
            <p>
              But Patrick saw things differently. A native of the region and an advocate for sustainable agriculture, he launched Legacy Coffee Ltd, focusing on single-origin Robusta coffee sourced from smallholders. “We’re not just buyers. We work hand in hand with farmers to help them improve quality through training in harvesting, fermentation, and drying,” he says. “That’s what sets us apart.”
            </p>
            <p>
              In a market where many assume smallholders can’t meet export standards, Patrick is flipping the script by empowering farmers with knowledge, tools, and access to premium markets.
            </p>
          </div>

          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-bold leading-tight text-brown md:text-3xl">
              Pivotal Partnership
            </h2>
            <div className="space-y-6 text-base leading-relaxed text-brown/80 md:text-lg">
              <p>
                In 2023, Patrick joined Imagine Her’s Social Enterprise &amp; Innovation Program and the partnership proved pivotal. “I reached out after hearing what Imagine Her does. Since then, we’ve received investment readiness training and patient returnable capital, which have been instrumental.”
              </p>
              <p>
                He explains, “The support enabled us to open a formal business bank account, improve our financial systems, and purchase Arabica coffee as a new addition to our product line. These steps not only strengthened our internal capacity but also positioned us better for future investment and market expansion.”
              </p>
              <p>
                Mentorship opened Patrick’s eyes to a bigger world, one where his coffee could carry the hopes of a community far beyond Uganda. “Imagine Her opened our minds. We started seeing what we do not just as business, but as something valuable to the world. It pushed us to think globally.”
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-bold leading-tight text-brown md:text-3xl">
              Export
            </h2>
            <div className="space-y-6 text-base leading-relaxed text-brown/80 md:text-lg">
              <p>
                Today Patrick exports to Germany, with an annual volume of half a tonne of Robusta coffee, a number he aims to scale significantly. Despite trade restrictions for roasted coffee, their consistent quality and eco-friendly approach opened doors. “We check the right boxes: sustainability, quality, and consistency,” he explains.
              </p>
              <p>
                This comes at a time when Uganda’s coffee sector is thriving. In April 2025 alone, Uganda exported 694,318 bags, earning US$ 214.38 million, according to the Ministry of Agriculture, Animal Industry and Fisheries (MAAIF). That’s a 77.44% surge in volume and a 152.56% increase in earnings compared to April 2024, marking one of the strongest single-month performances in the country’s history. Over the past year, Uganda’s total coffee exports reached 7.17 million bags (up from 5.90 million), and export revenue jumped to US$ 1.97 billion, reflecting Uganda’s emergence as a rising force in the global coffee market.
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-bold leading-tight text-brown md:text-3xl">
              Contribution
            </h2>
            <div className="space-y-6 text-base leading-relaxed text-brown/80 md:text-lg">
              <p>
                Legacy Coffee is contributing to this transformation one farmer at a time. “Most of our farmers used to sell unprocessed cherries because they needed quick cash or didn’t know better. Now, they ferment and dry their coffee, which brings higher prices,” Patrick shares. “They’re even employing others to help, so incomes and jobs are improving.”
              </p>
              <p>
                The company currently has five full-time staff and three seasonal workers, with dozens of farmers benefiting from ongoing training and access to better markets.
              </p>
              <p>
                For Monica Awidi, a smallholder coffee farmer in Rwibaale, Kyenjojo, joining Legacy Coffee marked a turning point. “Before, we sold our coffee to middlemen who offered very low prices. It was the only option we had, and we made very little from each harvest,” she recalls.
              </p>
              <p>
                That changed when Monica became part of the Legacy Coffee network. In addition to receiving better prices and reliable market demand, she also began attending farmer trainings held at Legacy Coffee’s learning site in Kyenjojo. “The training helped us improve how we harvest and dry our coffee, and that’s made a big difference in quality,” she explains.
              </p>
              <p>
                “Now, Legacy even books our coffee before we’ve harvested it. That gives us peace of mind, knowing that our produce already has a buyer and at a fair price.”
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-bold leading-tight text-brown md:text-3xl">
              Impact
            </h2>
            <div className="space-y-6 text-base leading-relaxed text-brown/80 md:text-lg">
              <p>
                The impact has extended beyond income. “With the money we’ve earned, my family has been able to buy more land. We’re planning to expand our coffee plantations next season,” Monica says proudly.
              </p>
              <p>
                According to the United States Department of Agriculture’s Coffee: World Markets and Trade report (December 2024), global coffee production for 2024/25 is forecast to reach 174.9 million bags, up 6.9 million from the previous year, with Vietnam and Indonesia rebounding. Global consumption is also on the rise, expected to increase by 5.1 million bags to 168.1 million, especially in the EU, United States, and China. However, ending stocks are projected to fall to 20.9 million bags, indicating tight supply and continued high demand.
              </p>
              <p>
                As the global coffee landscape shifts, Legacy Coffee is well positioned. “Coffee consumption in Uganda is still low,” Patrick explains, “but the international market is mature. That’s why quality matters more than ever.”
              </p>
              <p>
                Patrick’s dream is to build a network of 1,000 high-quality Robusta producers over the next five years. “Our biggest vision is to fully go into exporting both green and value-added coffee and to work closely with farmers on what quality is required,” he says.
              </p>
              <p>
                For him, access to innovation skills, mentorship, and market linkages is a game-changer for young entrepreneurs. “They may not have capital, but with knowledge and access, they can participate in markets that value creativity and consistency. Knowledge opens doors, money can’t.”
              </p>
              <p>
                As Uganda’s coffee exports rise, so too does the promise of a new kind of farmer—one who leads with knowledge, quality, and pride. Legacy Coffee is brewing that future, one bean at a time.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  )
}
