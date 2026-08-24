import Image from 'next/image'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/catalogue'
import { SHOP_PATHS, type Dictionary, type Locale } from '@/lib/i18n'

type HomeBodyProps = {
  dict: Dictionary
  locale: Locale
  products: Product[]
}

function SectionNumber({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="eyebrow text-accent">{n}</span>
      <h2 className="display text-3xl sm:text-4xl">{title}</h2>
    </div>
  )
}

export function HomeBody({ dict, locale, products }: HomeBodyProps) {
  const { hero, start, essentials, origin } = dict.home

  return (
    <main lang={locale === 'en' ? 'en' : undefined}>
      <section className="grain relative isolate flex min-h-[86vh] items-end overflow-hidden bg-ink text-paper">
        <Image
          src="/images/photos/hero/img-1136.webp"
          alt=""
          fill
          preload
          sizes="100vw"
          className="-z-10 animate-hero-drift object-cover object-right motion-reduce:animate-none sm:object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/80 to-ink/20" />

        <div className="mx-auto w-full max-w-[88rem] px-5 pb-16 lg:px-10 lg:pb-24">
          <p className="eyebrow text-accent">{hero.eyebrow}</p>
          <h1 className="display mt-6 max-w-5xl text-[clamp(2rem,9vw,7.5rem)]">
            {hero.headingBefore}
            <br />
            {hero.headingAfter} <span className="text-accent">{hero.headingEmphasis}</span>.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-neutral-300">{hero.intro}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/commencer"
              className="eyebrow bg-accent px-7 py-4 text-ink transition-transform hover:-translate-y-0.5"
            >
              {hero.ctaStart}
            </Link>
            <Link
              href={SHOP_PATHS[locale]}
              className="eyebrow border border-paper/30 px-7 py-4 text-paper transition-colors hover:border-paper"
            >
              {hero.ctaShop}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-32">
        <SectionNumber n={start.number} title={start.title} />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <p className="display text-2xl leading-tight sm:text-3xl">{start.statement}</p>
          <div className="space-y-5 text-neutral-700">
            <p className="leading-relaxed">{start.bodyPrimary}</p>
            <p className="leading-relaxed">{start.bodySecondary}</p>
            <Link
              href="/commencer"
              className="eyebrow inline-block border-b-2 border-accent pb-1 text-ink"
            >
              {start.link}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-neutral-100/60">
        <div className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionNumber n={essentials.number} title={essentials.title} />
            <Link
              href={SHOP_PATHS[locale]}
              className="eyebrow border-b-2 border-accent pb-1 text-ink"
            >
              {essentials.viewAllTemplate.replace('{count}', String(products.length))}
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.slug} product={product} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-32">
        <SectionNumber n={origin.number} title={origin.title} />
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div className="space-y-5 text-neutral-700">
            <p className="leading-relaxed">{origin.bodyPrimary}</p>
            <p className="leading-relaxed">{origin.bodySecondary}</p>
            <Link
              href="/a-propos"
              className="eyebrow inline-block border-b-2 border-accent pb-1 text-ink"
            >
              {origin.link}
            </Link>
          </div>

          <dl className="divide-y divide-ink/10 border-y border-ink/10">
            {origin.timeline.map((entry) => (
              <div key={entry.what} className="flex gap-6 py-4">
                <dt className="eyebrow w-28 shrink-0 pt-1 text-neutral-500">{entry.when}</dt>
                <dd className="text-sm leading-relaxed">{entry.what}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  )
}
