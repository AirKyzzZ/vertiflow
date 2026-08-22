import type { Metadata } from 'next'
import { BoutiqueBody } from '@/app/boutique/boutique-body'
import { getProducts } from '@/lib/catalogue'
import { SHOP_PATHS, buildAlternates, getDictionary } from '@/lib/i18n'

const dict = getDictionary('en')

export const metadata: Metadata = {
  title: dict.shop.seo.title,
  description: dict.shop.seo.description,
  alternates: buildAlternates('en', SHOP_PATHS),
}

export function Shop() {
  const products = getProducts()

  return <BoutiqueBody dict={dict} locale="en" products={products} />
}

export default Shop
