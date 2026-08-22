export const SITE_URL = 'https://vertiflow.fr'

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'VertiFlow',
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo-transparent.png`,
  sameAs: ['https://www.instagram.com/vertiflowfreerun/'],
}

export type BreadcrumbItem = { name: string; item?: string }

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      ...(entry.item ? { item: entry.item } : {}),
    })),
  }
}

export type ProductJsonLdInput = {
  name: string
  description: string
  sku: string
  price: string
  url: string
  images: string[]
  inStock: boolean
}

export function buildProductJsonLd(input: ProductJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    image: input.images.map((path) => `${SITE_URL}${path}`),
    description: input.description,
    sku: input.sku,
    brand: { '@type': 'Brand', name: 'VertiFlow' },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}${input.url}`,
      priceCurrency: 'EUR',
      price: input.price,
      availability: input.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'VertiFlow' },
    },
  }
}
