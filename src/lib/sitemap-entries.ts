import type { MetadataRoute } from 'next'

const SITE_URL = 'https://vertiflow.fr'

const HREFLANG = { fr: 'fr-FR', en: 'en-US' } as const

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

type LocalizedPaths = { fr: string; en: string }

function absolute(path: string): string {
  return `${SITE_URL}${path}`
}

function localizedEntries(
  paths: LocalizedPaths,
  changeFrequency: ChangeFrequency,
  priority: number,
): MetadataRoute.Sitemap {
  const languages = {
    'x-default': absolute(paths.fr),
    [HREFLANG.fr]: absolute(paths.fr),
    [HREFLANG.en]: absolute(paths.en),
  }

  return [
    { url: absolute(paths.fr), changeFrequency, priority, alternates: { languages } },
    { url: absolute(paths.en), changeFrequency, priority, alternates: { languages } },
  ]
}

function staticEntry(
  path: string,
  changeFrequency: ChangeFrequency,
  priority: number,
): MetadataRoute.Sitemap[number] {
  return { url: absolute(path), changeFrequency, priority }
}

export type SitemapProduct = { slug: string }

export function buildSitemapEntries(
  products: SitemapProduct[],
  journalSlugs: string[],
): MetadataRoute.Sitemap {
  return [
    ...localizedEntries({ fr: '/', en: '/en' }, 'monthly', 1),
    ...localizedEntries({ fr: '/boutique', en: '/en/shop' }, 'weekly', 0.9),
    ...products.flatMap((product) =>
      localizedEntries(
        { fr: `/boutique/${product.slug}`, en: `/en/shop/${product.slug}` },
        'weekly',
        0.8,
      ),
    ),
    staticEntry('/commencer', 'monthly', 0.8),
    staticEntry('/guide-des-tailles', 'monthly', 0.5),
    staticEntry('/faq', 'monthly', 0.5),
    staticEntry('/journal', 'monthly', 0.5),
    ...journalSlugs.map((slug) => staticEntry(`/journal/${slug}`, 'yearly', 0.4)),
    staticEntry('/a-propos', 'monthly', 0.4),
    staticEntry('/livraison-et-paiement', 'monthly', 0.4),
    staticEntry('/contact', 'monthly', 0.3),
    staticEntry('/cgv', 'yearly', 0.3),
    staticEntry('/mentions-legales', 'yearly', 0.3),
    staticEntry('/confidentialite', 'yearly', 0.3),
  ]
}
