import Link from 'next/link'

const links = [
  { href: '/commencer', label: 'Commencer' },
  { href: '/boutique', label: 'Boutique' },
  { href: '/journal', label: 'Journal' },
  { href: '/a-propos', label: 'À propos' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[88rem] items-center justify-between px-5 py-4 lg:px-10">
        <Link href="/" className="display text-xl leading-none">
          Verti<span className="text-accent">Flow</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="eyebrow text-neutral-700 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <details className="group relative md:hidden">
          <summary className="eyebrow cursor-pointer list-none py-1 text-ink [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <div className="absolute right-0 top-full mt-3 w-48 border border-ink/10 bg-paper p-4 shadow-xl">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="eyebrow block py-2 text-neutral-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  )
}
