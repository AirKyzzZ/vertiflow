'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SHOP_PATHS, getDictionary, localeFromPathname } from '@/lib/i18n'

export function SiteFooter() {
  const pathname = usePathname()
  const locale = localeFromPathname(pathname)
  const dict = getDictionary(locale).footer

  const columns = [
    {
      title: dict.shopTitle,
      links: [
        { href: SHOP_PATHS[locale], label: dict.shopEssentials },
        { href: '/guide-des-tailles', label: dict.shopSizeGuide },
        { href: '/livraison-et-paiement', label: dict.shopShipping },
      ],
    },
    {
      title: dict.brandTitle,
      links: [
        { href: '/commencer', label: dict.brandStart },
        { href: '/a-propos', label: dict.brandAbout },
        { href: '/journal', label: dict.brandJournal },
        { href: '/contact', label: dict.brandContact },
      ],
    },
    {
      title: dict.legalTitle,
      links: [
        { href: '/mentions-legales', label: dict.legalMentions },
        { href: '/cgv', label: dict.legalTerms },
        { href: '/confidentialite', label: dict.legalPrivacy },
      ],
    },
  ]

  return (
    <footer className="grain bg-ink text-paper">
      <div className="mx-auto max-w-[88rem] px-5 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <p className="display text-3xl leading-none">
              Verti<span className="text-accent">Flow</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-300">{dict.tagline}</p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="eyebrow text-accent">{column.title}</p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-300 transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {column.title === dict.legalTitle && locale === 'en' && (
                <p className="mt-4 text-xs leading-relaxed text-neutral-500">
                  Legal documents are in French only.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-paper/15 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{dict.copyrightTemplate.replace('{year}', String(new Date().getFullYear()))}</span>
          <span>
            {dict.clubNotePrefix}{' '}
            <a href="https://pkba.vertiflow.fr" className="text-neutral-300 hover:text-accent">
              PKBA
            </a>{' '}
            {dict.clubNoteSuffix}
          </span>
        </div>
      </div>
    </footer>
  )
}
