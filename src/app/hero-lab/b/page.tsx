import type { Metadata } from 'next'
import Link from 'next/link'
import { HeroLabBurst } from '@/components/motion/hero-lab-burst'
import { HeroLabStaggerHeadline } from '@/components/motion/hero-lab-stagger-headline'
import { LineReveal } from '@/components/motion/line-reveal'
import { ParallaxLayer } from '@/components/motion/parallax-layer'
import { RiseIn } from '@/components/motion/rise-in'
import { getDictionary, SHOP_PATHS } from '@/lib/i18n'

const dict = getDictionary('fr')

const BURST_FRAMES = [
  '/images/photos/hero/img-1161.webp',
  '/images/photos/hero/img-0740.webp',
  '/images/photos/hero/img-1029.webp',
  '/images/photos/hero/img-0931.webp',
  '/images/photos/hero/img-1136.webp',
]

export const metadata: Metadata = {
  title: 'Hero Lab B — Frame Burst',
  description: 'Prototype: a rapid strobe through five movement frames that settles on one.',
}

export function HeroLabB() {
  const { hero } = dict.home

  return (
    <main>
      <section className="grain relative isolate flex min-h-[86vh] items-end overflow-hidden bg-ink text-paper">
        <ParallaxLayer className="-z-10">
          <HeroLabBurst frames={BURST_FRAMES} />
        </ParallaxLayer>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/80 to-ink/20" />

        <div className="mx-auto w-full max-w-[88rem] px-5 pb-16 lg:px-10 lg:pb-24">
          <LineReveal as="p" className="eyebrow text-accent">
            {hero.eyebrow}
          </LineReveal>
          <HeroLabStaggerHeadline
            before={hero.headingBefore}
            after={hero.headingAfter}
            emphasis={hero.headingEmphasis}
            delay={0.42}
            className="display mt-6 max-w-5xl text-[clamp(2rem,9vw,7.5rem)]"
          />
          <LineReveal as="p" className="mt-8 max-w-xl text-base leading-relaxed text-neutral-300" delay={0.85}>
            {hero.intro}
          </LineReveal>
          <RiseIn className="mt-10 flex flex-wrap gap-3" delay={1.05}>
            <Link
              href="/commencer"
              className="eyebrow bg-accent px-7 py-4 text-ink transition-transform hover:-translate-y-0.5"
            >
              {hero.ctaStart}
            </Link>
            <Link
              href={SHOP_PATHS.fr}
              className="eyebrow border border-paper/30 px-7 py-4 text-paper transition-colors hover:border-paper"
            >
              {hero.ctaShop}
            </Link>
          </RiseIn>
        </div>
      </section>
    </main>
  )
}

export default HeroLabB
