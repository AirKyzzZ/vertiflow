import type { Metadata } from 'next'
import Link from 'next/link'
import { faqGroups } from './faq-data'

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Les questions les plus fréquentes sur la commande, la livraison et les produits VertiFlow.',
  alternates: { canonical: '/faq' },
}

export function FaqPage() {
  return (
    <main>
      <div className="mx-auto max-w-[88rem] px-5 pt-16 lg:px-10 lg:pt-24">
        <header className="relative border-b border-ink/10 pb-10">
          <div className="flex items-baseline gap-4">
            <span className="eyebrow text-accent">Aide</span>
            <h1 className="display min-w-0 wrap-anywhere text-[clamp(2.5rem,7vw,5rem)]">FAQ</h1>
          </div>
          <p className="rule-marker relative mt-8 max-w-xl pl-11 leading-relaxed text-neutral-700">
            Les questions qu&apos;on nous pose le plus souvent, sur la commande, la
            livraison et les produits.
          </p>
        </header>
      </div>

      <div className="mx-auto max-w-[88rem] px-5 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          {faqGroups.map((group) => (
            <section key={group.title}>
              <h2 className="display text-2xl sm:text-3xl">{group.title}</h2>
              <div className="mt-8 divide-y divide-ink/10 border-t border-ink/10">
                {group.items.map((item) => (
                  <details
                    key={item.question}
                    className="group py-5 [&::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <span className="text-base leading-snug">{item.question}</span>
                      <span className="eyebrow shrink-0 text-accent transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="mt-4 max-w-md pr-8 text-sm leading-relaxed text-neutral-700 [&_a]:text-accent [&_a]:underline">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-ink/10 pt-16 lg:mt-20 lg:pt-20">
          <p className="max-w-md leading-relaxed text-neutral-700">
            Toujours une question ?{' '}
            <a href="mailto:vertiflow.pro@gmail.com" className="text-accent underline">
              Écris-nous
            </a>
            .
          </p>
          <Link
            href="/guide-des-tailles"
            className="eyebrow border-b-2 border-accent pb-1 text-ink"
          >
            Guide des tailles →
          </Link>
        </section>
      </div>
    </main>
  )
}

export default FaqPage
