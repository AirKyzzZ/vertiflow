import Image from 'next/image'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/catalogue'
import type { Dictionary, Locale } from '@/lib/i18n'

type BoutiqueBodyProps = {
  dict: Dictionary
  locale: Locale
  products: Product[]
}

type CardLayout = { span: string; lift: string }

const LAYOUT: CardLayout[] = [
  { span: 'lg:col-span-7', lift: '' },
  { span: 'lg:col-span-5', lift: 'lg:mt-28' },
  { span: 'lg:col-span-4', lift: '' },
  { span: 'lg:col-span-4', lift: 'lg:mt-16' },
  { span: 'lg:col-span-4', lift: '' },
  { span: 'lg:col-span-5', lift: '' },
  { span: 'lg:col-span-7', lift: 'lg:mt-20' },
  { span: 'lg:col-span-6', lift: '' },
  { span: 'lg:col-span-6', lift: 'lg:mt-24' },
]

const DEFAULT_LAYOUT: CardLayout = { span: 'lg:col-span-6', lift: '' }

export function BoutiqueBody({ dict, locale, products }: BoutiqueBodyProps) {
  const { shop } = dict

  return (
    <main lang={locale === 'en' ? 'en' : undefined}>
      <div className="mx-auto max-w-[88rem] px-5 pt-16 lg:px-10 lg:pt-24">
        <header className="relative border-b border-ink/10 pb-10">
          <div className="flex items-baseline gap-4">
            <span className="eyebrow text-accent">{shop.number}</span>
            <h1 className="display text-[clamp(2.5rem,7vw,5rem)]">{shop.heading}</h1>
          </div>
          <p className="rule-marker relative mt-8 max-w-md pl-11 leading-relaxed text-neutral-700">
            {shop.intro}
          </p>
        </header>
      </div>

      <section className="grain relative mt-14 aspect-[16/9] w-full overflow-hidden bg-ink lg:mt-20">
        <Image
          src="/images/site/boutique-band.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/5 to-transparent" />
        <div className="absolute inset-x-5 top-10 lg:inset-x-10 lg:top-16">
          <p className="eyebrow text-accent">{shop.bandEyebrow}</p>
          <p className="display mt-4 max-w-lg text-3xl text-paper sm:text-4xl lg:text-5xl">
            {shop.bandLine}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[88rem] px-5 pb-20 pt-16 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="grid grid-cols-2 items-start gap-x-4 gap-y-14 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-6">
          {products.map((product, index) => {
            const layout = LAYOUT[index] ?? DEFAULT_LAYOUT
            return (
              <div key={product.slug} className={`${layout.span} ${layout.lift}`}>
                <ProductCard product={product} index={index} locale={locale} />
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
