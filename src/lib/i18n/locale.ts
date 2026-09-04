import type { Metadata } from 'next'

export type Locale = 'fr' | 'en'

export const LOCALES: Locale[] = ['fr', 'en']

export const DEFAULT_LOCALE: Locale = 'fr'

export const HREFLANG: Record<Locale, string> = {
  fr: 'fr-FR',
  en: 'en-US',
}

export const LOCALE_META: Record<Locale, { code: string; name: string }> = {
  fr: { code: 'FR', name: 'Français' },
  en: { code: 'EN', name: 'English' },
}

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale)
}

export function localeFromPathname(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'fr'
}

export type RoutePaths = Record<Locale, string>

export const HOME_PATHS: RoutePaths = { fr: '/', en: '/en' }
export const SHOP_PATHS: RoutePaths = { fr: '/boutique', en: '/en/shop' }

export function productPaths(slug: string): RoutePaths {
  return { fr: `/boutique/${slug}`, en: `/en/shop/${slug}` }
}

export function buildAlternates(locale: Locale, paths: RoutePaths): NonNullable<Metadata['alternates']> {
  const languages: Record<string, string> = { 'x-default': paths[DEFAULT_LOCALE] }
  for (const loc of LOCALES) {
    languages[HREFLANG[loc]] = paths[loc]
  }
  return { canonical: paths[locale], languages }
}

export function alternatePath(pathname: string): string | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  if (clean === HOME_PATHS.fr) return HOME_PATHS.en
  if (clean === HOME_PATHS.en) return HOME_PATHS.fr
  if (clean === SHOP_PATHS.fr) return SHOP_PATHS.en
  if (clean === SHOP_PATHS.en) return SHOP_PATHS.fr

  const frProduct = /^\/boutique\/([^/]+)$/.exec(clean)
  if (frProduct) return `${SHOP_PATHS.en}/${frProduct[1]}`

  const enProduct = /^\/en\/shop\/([^/]+)$/.exec(clean)
  if (enProduct) return `${SHOP_PATHS.fr}/${enProduct[1]}`

  return null
}

export function formatPrice(price: number | string, locale: Locale): string {
  const amount = typeof price === 'number' ? price : Number(price)
  const formatted = new Intl.NumberFormat(HREFLANG[locale], {
    style: 'currency',
    currency: 'EUR',
    useGrouping: locale !== DEFAULT_LOCALE,
  }).format(amount)
  return locale === DEFAULT_LOCALE ? formatted.replace(/[\u00a0\u202f]/g, ' ') : formatted
}
