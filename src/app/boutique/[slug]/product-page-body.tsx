import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { ProductPurchase } from '@/components/product-purchase'
import { colours, sizes, type Product } from '@/lib/catalogue'
import type { ProductCopy } from '@/lib/product-copy'
import { SHOP_PATHS, formatPrice, type Dictionary, type Locale } from '@/lib/i18n'

type ProductPageBodyProps = {
  dict: Dictionary
  locale: Locale
  product: Product
  copy: ProductCopy
  index: number
  total: number
  crossSell: Product[]
}

export function ProductPageBody({
  dict,
  locale,
  product,
  copy,
  index,
  total,
  crossSell,
}: ProductPageBodyProps) {
  const palette = colours(product)
  const sizeOptions = sizes(product, palette[0])

  return (
    <main lang={locale === 'en' ? 'en' : undefined}>
      <div className="mx-auto grid max-w-[88rem] gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20 lg:px-10 lg:pb-28 lg:pt-20">
        <ProductPurchase
          slug={product.slug}
          name={product.name}
          index={index}
          total={total}
          lead={copy.lead}
          body={copy.body}
          formattedPrice={formatPrice(product.price, locale)}
          palette={palette}
          sizes={sizeOptions}
          specs={copy.specs}
          dict={dict.product}
        />
      </div>

      <section className="border-y border-ink/10 bg-neutral-100/60">
        <div className="mx-auto max-w-[88rem] px-5 py-16 lg:px-10 lg:py-24">
          <p className="eyebrow text-accent">{dict.product.crossSellEyebrow}</p>
          <h2 className="display mt-4 text-2xl sm:text-3xl">{dict.product.crossSellTitle}</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
            {crossSell.map((entry, position) => (
              <ProductCard key={entry.slug} product={entry} index={position} locale={locale} />
            ))}
          </div>
          <Link
            href={SHOP_PATHS[locale]}
            className="eyebrow mt-10 inline-block border-b-2 border-accent pb-1 text-ink"
          >
            {dict.product.crossSellLink}
          </Link>
        </div>
      </section>
    </main>
  )
}
