import type { Metadata } from 'next'
import { HomeBody } from '@/app/home-body'
import { getProducts } from '@/lib/catalogue'
import { HOME_PATHS, buildAlternates, getDictionary } from '@/lib/i18n'

const dict = getDictionary('en')

export const metadata: Metadata = {
  title: { absolute: dict.home.seo.title },
  description: dict.home.seo.description,
  alternates: buildAlternates('en', HOME_PATHS),
}

export function HomeEn() {
  const products = getProducts()

  return <HomeBody dict={dict} locale="en" products={products} />
}

export default HomeEn
