'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALE_META, alternatePath, localeFromPathname } from '@/lib/i18n'

export function LanguageSwitcher() {
  const pathname = usePathname()
  const target = alternatePath(pathname)

  if (!target) return null

  const currentLocale = localeFromPathname(pathname)
  const targetLocale = currentLocale === 'fr' ? 'en' : 'fr'
  const meta = LOCALE_META[targetLocale]

  return (
    <Link
      href={target}
      hrefLang={targetLocale}
      aria-label={meta.name}
      className="eyebrow text-neutral-500 transition-colors hover:text-ink"
    >
      {meta.code}
    </Link>
  )
}
