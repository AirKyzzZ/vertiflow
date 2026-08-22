import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductPageBody } from '@/app/boutique/[slug]/product-page-body'
import { activeVariants, colours, getProduct, getProducts } from '@/lib/catalogue'
import { heroFor, mediaFor } from '@/lib/product-media'
import { productCopy } from '@/lib/product-copy'
import { buildAlternates, getDictionary, productPaths } from '@/lib/i18n'
import { SITE_URL, buildBreadcrumbJsonLd, buildProductJsonLd } from '@/lib/structured-data'

type ProductPageParams = { params: Promise<{ slug: string }> }

const dict = getDictionary('fr')

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
    alternates: buildAlternates('fr', productPaths(slug)),
  }
}

export async function ProductPage({ params }: ProductPageParams) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  const products = getProducts()
  const index = products.findIndex((entry) => entry.slug === slug)
  const copy = productCopy[slug]
  if (!copy) notFound()

  const crossSell = products.filter((entry) => entry.slug !== slug).slice(0, 3)

  const productJsonLd = buildProductJsonLd({
    name: product.name,
    description: copy.lead,
    sku: product.slug,
    price: product.price,
    url: productPaths(slug).fr,
    images: mediaFor(product.slug, colours(product)[0]),
    inStock: activeVariants(product).length > 0,
  })

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Accueil', item: SITE_URL },
    { name: dict.shop.heading, item: `${SITE_URL}/boutique` },
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
        locale="fr"
        product={product}
        copy={copy}
        index={index}
        total={products.length}
        crossSell={crossSell}
      />
    </>
  )
}

export default ProductPage
