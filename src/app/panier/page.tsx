import { getProducts } from '@/lib/catalogue'
import { PanierClient, type ProductSummary } from './panier-client'

export function Panier() {
  const summaries: ProductSummary[] = getProducts().map((product) => ({
    slug: product.slug,
    name: product.name,
    price: product.price,
  }))

  return <PanierClient products={summaries} />
}

export default Panier
