import { getProducts } from '@/lib/catalogue'
import { CommandeClient, type ProductSummary } from './commande-client'

export function Commande() {
  const summaries: ProductSummary[] = getProducts().map((product) => ({
    slug: product.slug,
    name: product.name,
    price: product.price,
  }))

  return <CommandeClient products={summaries} />
}

export default Commande
