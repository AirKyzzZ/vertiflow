import type { CartLine } from '@/lib/cart'
import { heroFor } from '@/lib/product-media'

export type ProductSummary = {
  slug: string
  name: string
  price: string
}

export type PricedLine = {
  line: CartLine
  name: string
  image: string
  unitPrice: number | null
  total: number | null
}

export const SHIPPING_DISCLOSURE = 'Livraison à partir de 6,99 € (France).'

function findProduct(products: ProductSummary[], slug: string): ProductSummary | undefined {
  return products.find((product) => product.slug === slug)
}

export function priceLines(lines: CartLine[], products: ProductSummary[]): PricedLine[] {
  return lines.map((line) => {
    const product = findProduct(products, line.slug)
    const unitPrice = product ? Number(product.price) : null
    return {
      line,
      name: product?.name ?? line.slug,
      image: heroFor(line.slug, line.color),
      unitPrice,
      total: unitPrice === null ? null : unitPrice * line.quantity,
    }
  })
}

export function cartTotal(priced: PricedLine[]): number {
  return priced.reduce((sum, entry) => sum + (entry.total ?? 0), 0)
}
