import Link from 'next/link'

const columns = [
  {
    title: 'Boutique',
    links: [
      { href: '/boutique', label: "L'essentiel" },
      { href: '/guide-des-tailles.html', label: 'Guide des tailles' },
      { href: '/livraison-et-paiement', label: 'Livraison et paiement' },
    ],
  },
  {
    title: 'La marque',
    links: [
      { href: '/commencer', label: 'Commencer le parkour' },
      { href: '/a-propos', label: 'Notre histoire' },
      { href: '/journal', label: 'Journal' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/cgv', label: 'CGV' },
      { href: '/confidentialite', label: 'Confidentialité' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="grain bg-ink text-paper">
      <div className="mx-auto max-w-[88rem] px-5 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <p className="display text-3xl leading-none">
              Verti<span className="text-accent">Flow</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-300">
              Des vêtements faits pour bouger, par un athlète qui a fondé un club.
              Bassin d&apos;Arcachon.
            </p>
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
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-paper/15 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} VertiFlow — micro-entreprise</span>
          <span>
            Le club{' '}
            <a href="https://pkba.vertiflow.fr" className="text-neutral-300 hover:text-accent">
              PKBA
            </a>{' '}
            est une association loi 1901 distincte.
          </span>
        </div>
      </div>
    </footer>
  )
}
