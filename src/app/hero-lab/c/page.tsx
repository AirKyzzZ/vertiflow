import type { Metadata } from 'next'
import Link from 'next/link'
import { HeroLabAmplitudeImage } from '@/components/motion/hero-lab-amplitude-image'
import { HeroLabRise } from '@/components/motion/hero-lab-rise'
import { HeroLabStaggerHeadline } from '@/components/motion/hero-lab-stagger-headline'
import { LineReveal } from '@/components/motion/line-reveal'
import { ParallaxLayer } from '@/components/motion/parallax-layer'
import { getDictionary, SHOP_PATHS } from '@/lib/i18n'

const dict = getDictionary('fr')

export const metadata: Metadata = {
  title: 'Hero Lab C — Bold Amplitude',
  description: 'Prototype: the original hero motion, dialled up until it clearly registers.',
}

export function HeroLabC() {
  const { hero } = dict.home

  return (
    <main>
      <section className="grain relative isolate flex min-h-[86vh] items-end overflow-hidden bg-ink text-paper">
        <ParallaxLayer className="-z-10">
          <HeroLabAmplitudeImage src="/images/photos/hero/img-1136.webp" />
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
            initialY={72}
            initialStretch="62%"
            duration={1.15}
            stagger={0.32}
            ease="power4.out"
            className="display mt-6 max-w-5xl text-[clamp(2rem,9vw,7.5rem)]"
          />
          <HeroLabRise
            as="p"
            className="mt-8 max-w-xl text-base leading-relaxed text-neutral-300"
            delay={1.05}
            distance={56}
            duration={0.9}
          >
            {hero.intro}
          </HeroLabRise>
          <HeroLabRise
            as="div"
            className="mt-10 flex flex-wrap gap-3"
            delay={1.3}
            distance={64}
            duration={0.9}
          >
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
          </HeroLabRise>
        </div>
      </section>
    </main>
  )
}

export default HeroLabC
