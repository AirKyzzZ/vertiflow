import type { Metadata } from 'next'
import { HomeBody } from '@/app/home-body'
import { getProducts } from '@/lib/catalogue'
import { HOME_PATHS, buildAlternates, getDictionary } from '@/lib/i18n'

const dict = getDictionary('fr')

export const metadata: Metadata = {
  alternates: buildAlternates('fr', HOME_PATHS),
}

export function Home() {
  const products = getProducts()

  return <HomeBody dict={dict} locale="fr" products={products} />
}

export default Home
