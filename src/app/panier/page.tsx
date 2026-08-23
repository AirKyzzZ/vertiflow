import type { Metadata } from 'next'
import { getProducts } from '@/lib/catalogue'
import { PanierClient } from './panier-client'
import type { ProductSummary } from '@/lib/cart-pricing'

export const metadata: Metadata = {
  title: 'Panier',
  description: 'Ton panier VertiFlow : les pièces choisies, avant de passer commande.',
  robots: { index: false, follow: false },
}

export function Panier() {
  const summaries: ProductSummary[] = getProducts().map((product) => ({
    slug: product.slug,
    name: product.name,
    price: product.price,
  }))

  return <PanierClient products={summaries} />
}

export default Panier
