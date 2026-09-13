import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductPageBody } from '@/app/boutique/[slug]/product-page-body'
import { activeVariants, colours, getProduct, getProducts } from '@/lib/catalogue'
import { mediaFor } from '@/lib/product-media'
import { buildAlternates, getDictionary, productCopyEn, productPaths } from '@/lib/i18n'
import { SITE_URL, buildBreadcrumbJsonLd, buildProductJsonLd } from '@/lib/structured-data'

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

  return {
    title: product.name,
    description: copy.lead,
    openGraph: {
      title: product.name,
      description: copy.lead,
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

  const productJsonLd = buildProductJsonLd({
    name: product.name,
    description: copy.lead,
    sku: product.slug,
    price: product.price,
    url: productPaths(slug).en,
    images: mediaFor(product.slug, colours(product)[0]),
    inStock: activeVariants(product).length > 0,
  })

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', item: `${SITE_URL}/en` },
    { name: dict.shop.heading, item: `${SITE_URL}/en/shop` },
    { name: product.name },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductPageBody
        dict={dict}
        locale="en"
        product={product}
        copy={copy}
        index={index}
        total={products.length}
        crossSell={crossSell}
      />
    </>
  )
}

export default ProductPageEn
