import type { Metadata } from 'next'
import { getProducts } from '@/lib/catalogue'
import { CommandeClient } from './commande-client'
import type { ProductSummary } from '@/lib/cart-pricing'

export const metadata: Metadata = {
  title: 'Commande',
  description: 'Finalise ta commande VertiFlow : livraison et paiement sécurisé par carte.',
  robots: { index: false, follow: false },
}

export function Commande() {
  const summaries: ProductSummary[] = getProducts().map((product) => ({
    slug: product.slug,
    name: product.name,
    price: product.price,
  }))

  return <CommandeClient products={summaries} />
}

export default Commande
