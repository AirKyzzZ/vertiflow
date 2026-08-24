import type { Metadata } from 'next'
import Link from 'next/link'
import { HeroLabStaggerHeadline } from '@/components/motion/hero-lab-stagger-headline'
import { LineReveal } from '@/components/motion/line-reveal'
import { RiseIn } from '@/components/motion/rise-in'
import { getDictionary, SHOP_PATHS } from '@/lib/i18n'
import styles from './photo-word.module.css'

const dict = getDictionary('fr')

export const metadata: Metadata = {
  title: 'Hero Lab A — Photo in Type',
  description: 'Prototype: the headline letterforms as a window onto the photography.',
}

export function HeroLabA() {
  const { hero } = dict.home

  return (
    <>
      <link rel="preload" as="image" href="/images/photos/hero/img-1136.webp" fetchPriority="high" />
      <main>
        <section className="grain relative isolate flex min-h-[86vh] items-end overflow-hidden bg-paper text-ink">
          <div className="mx-auto w-full max-w-[88rem] px-5 pb-16 lg:px-10 lg:pb-24">
            <LineReveal as="p" className="eyebrow text-accent">
              {hero.eyebrow}
            </LineReveal>
            <HeroLabStaggerHeadline
              before={hero.headingBefore}
              after={hero.headingAfter}
              emphasis={hero.headingEmphasis}
              emphasisClassName={styles.photoWord}
              className="display mt-6 max-w-5xl text-[clamp(2rem,9vw,7.5rem)]"
            />
            <LineReveal as="p" className="mt-8 max-w-xl text-base leading-relaxed text-neutral-700" delay={0.5}>
              {hero.intro}
            </LineReveal>
            <RiseIn className="mt-10 flex flex-wrap gap-3" delay={0.7}>
              <Link
                href="/commencer"
                className="eyebrow bg-accent px-7 py-4 text-ink transition-transform hover:-translate-y-0.5"
              >
                {hero.ctaStart}
              </Link>
              <Link
                href={SHOP_PATHS.fr}
                className="eyebrow border border-ink/30 px-7 py-4 text-ink transition-colors hover:border-ink"
              >
                {hero.ctaShop}
              </Link>
            </RiseIn>
          </div>
        </section>
      </main>
    </>
  )
}

export default HeroLabA
