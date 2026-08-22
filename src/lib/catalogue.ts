import 'server-only'
import { catalogue } from './commerce.server'

export type Variant = {
  color: string
  size: string
  stripe_price_id: string
  image_url: string
  active: boolean
}

export type Product = {
  slug: string
  name: string
  price: string
  variants: Variant[]
}

const products = (catalogue as { products: Product[] }).products

export function getProducts(): Product[] {
  return products
}

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug)
}

export function activeVariants(product: Product): Variant[] {
  return product.variants.filter((variant) => variant.active)
}

export function colours(product: Product): string[] {
  return [...new Set(activeVariants(product).map((variant) => variant.color))]
}

export function sizes(product: Product, colour: string): string[] {
  return [
    ...new Set(
      activeVariants(product)
        .filter((variant) => variant.color === colour)
        .map((variant) => variant.size),
    ),
  ]
}
