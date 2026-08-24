import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hero Lab',
  description: 'Three prototype hero treatments for review.',
}

const VARIANTS = [
  {
    href: '/hero-lab/a',
    title: 'A — Photo in type',
    copy: 'CONTOURNER filled with the movement frame, background-clip: text against a paper field.',
  },
  {
    href: '/hero-lab/b',
    title: 'B — Frame burst',
    copy: 'A strobe through five frames on load, then a hold.',
  },
  {
    href: '/hero-lab/c',
    title: 'C — Bold amplitude',
    copy: 'The current concept, dialled up until it clearly registers.',
  },
]

export function HeroLabIndex() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 lg:px-10">
      <p className="eyebrow text-accent">Internal review</p>
      <h1 className="display mt-4 text-4xl">Hero Lab</h1>
      <ul className="mt-10 space-y-8">
        {VARIANTS.map((variant) => (
          <li key={variant.href} className="border-t border-ink/10 pt-6">
            <Link href={variant.href} className="display block text-2xl">
              {variant.title}
            </Link>
            <p className="mt-2 max-w-xl text-neutral-700">{variant.copy}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default HeroLabIndex
