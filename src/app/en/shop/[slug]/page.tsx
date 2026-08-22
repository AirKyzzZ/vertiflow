import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductPageBody } from '@/app/boutique/[slug]/product-page-body'
import { getProduct, getProducts } from '@/lib/catalogue'
import { heroFor } from '@/lib/product-media'
import { buildAlternates, getDictionary, productCopyEn, productPaths } from '@/lib/i18n'

type ProductPageParams = { params: Promise<{ slug: string }> }

const dict = getDictionary('en')

export function generateStaticParams() {
  return getProducts().map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: ProductPageParams): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return {}

  const copy = productCopyEn[slug]
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
    alternates: buildAlternates('en', productPaths(slug)),
  }
}

export async function ProductPageEn({ params }: ProductPageParams) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  const products = getProducts()
  const index = products.findIndex((entry) => entry.slug === slug)
  const copy = productCopyEn[slug]
  if (!copy) notFound()

  const crossSell = products.filter((entry) => entry.slug !== slug).slice(0, 3)

  return (
    <ProductPageBody
      dict={dict}
      locale="en"
      product={product}
      copy={copy}
      index={index}
      total={products.length}
      crossSell={crossSell}
    />
  )
}

export default ProductPageEn
