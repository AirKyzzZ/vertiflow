import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const LAB_LINKS = [
  { href: '/hero-lab/a', label: 'A · Photo in type' },
  { href: '/hero-lab/b', label: 'B · Frame burst' },
  { href: '/hero-lab/c', label: 'C · Bold amplitude' },
]

export default function HeroLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="eyebrow flex flex-wrap items-center gap-5 border-b border-ink/10 bg-paper px-5 py-3 text-neutral-500 lg:px-10">
        <Link href="/hero-lab">Hero Lab</Link>
        {LAB_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-ink transition-colors hover:text-accent">
            {link.label}
          </Link>
        ))}
      </div>
      {children}
    </>
  )
}
