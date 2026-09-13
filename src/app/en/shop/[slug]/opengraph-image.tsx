import { notFound } from 'next/navigation'
import { getProduct, getProducts } from '@/lib/catalogue'
import { getDictionary } from '@/lib/i18n'
import { renderProductOgImage } from '@/lib/og/product-card'
import { OG_SIZE } from '@/lib/og/theme'

export const alt = 'VertiFlow piece, club shop'
export const size = OG_SIZE
export const contentType = 'image/png'

const dict = getDictionary('en')

export function generateStaticParams() {
  return getProducts().map((product) => ({ slug: product.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  return renderProductOgImage({ product, locale: 'en', eyebrow: dict.shop.heading })
}
