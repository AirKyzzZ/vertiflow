import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import { ProductPurchase } from '@/components/product-purchase'
import { colours, formatPrice, getProduct, getProducts, sizes } from '@/lib/catalogue'
import { heroFor } from '@/lib/product-media'
import { productCopy } from '@/lib/product-copy'

type ProductPageParams = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getProducts().map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: ProductPageParams): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return {}

  const copy = productCopy[slug]
  if (!copy) notFound()

  const image = heroFor(slug)

  return {
    title: product.name,
    description: copy.lead,
    openGraph: {
      title: product.name,
      description: copy.lead,
      images: image ? [{ url: image, width: 800, height: 800 }] : undefined,
    },
  }
}

export async function ProductPage({ params }: ProductPageParams) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  const products = getProducts()
  const index = products.findIndex((entry) => entry.slug === slug)
  const palette = colours(product)
  const sizeOptions = sizes(product, palette[0])
  const copy = productCopy[slug]
  if (!copy) notFound()

  const crossSell = products.filter((entry) => entry.slug !== slug).slice(0, 3)

  return (
    <main>
      <div className="mx-auto grid max-w-[88rem] gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20 lg:px-10 lg:pb-28 lg:pt-20">
        <ProductPurchase
          slug={product.slug}
          name={product.name}
          index={index}
          total={products.length}
          lead={copy.lead}
          body={copy.body}
          formattedPrice={formatPrice(product.price)}
          palette={palette}
          sizes={sizeOptions}
          specs={copy.specs}
        />
      </div>

      <section className="border-y border-ink/10 bg-neutral-100/60">
        <div className="mx-auto max-w-[88rem] px-5 py-16 lg:px-10 lg:py-24">
          <p className="eyebrow text-accent">Aussi dans la boutique</p>
          <h2 className="display mt-4 text-2xl sm:text-3xl">Pour compléter</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
            {crossSell.map((entry, position) => (
              <ProductCard key={entry.slug} product={entry} index={position} />
            ))}
          </div>
          <Link
            href="/boutique"
            className="eyebrow mt-10 inline-block border-b-2 border-accent pb-1 text-ink"
          >
            Toute la boutique →
          </Link>
        </div>
      </section>
    </main>
  )
}

export default ProductPage
