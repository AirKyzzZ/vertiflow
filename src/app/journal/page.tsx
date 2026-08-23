import type { Metadata } from 'next'
import Link from 'next/link'
import { JournalEntryCard } from '@/app/journal/journal-entry-card'
import { getJournalPosts } from '@/app/journal/journal-data'

export const metadata: Metadata = {
  title: 'Journal',
  description: "Les étapes de compétition, et ce qui s'est construit après.",
  alternates: { canonical: '/journal' },
}

export function Journal() {
  const posts = getJournalPosts()
  const [featured, ...rest] = posts

  return (
    <main>
      <div className="mx-auto max-w-[88rem] px-5 pt-16 lg:px-10 lg:pt-24">
        <header className="relative border-b border-ink/10 pb-10">
          <div className="flex items-baseline gap-4">
            <span className="eyebrow text-accent">03</span>
            <h1 className="display min-w-0 wrap-anywhere text-[clamp(2.5rem,7vw,5rem)]">Journal</h1>
          </div>
          <p className="rule-marker relative mt-8 max-w-md pl-11 leading-relaxed text-neutral-700">
            Les étapes de compétition, et ce qui s&apos;est construit après, sur le Bassin
            d&apos;Arcachon.
          </p>
        </header>
      </div>

      <div className="mx-auto max-w-[88rem] px-5 py-16 lg:px-10 lg:py-24">
        {featured && (
          <div className="border-b border-ink/10 pb-16 lg:pb-20">
            <JournalEntryCard post={featured} featured />
          </div>
        )}

        {rest.length > 0 && (
          <div className="mt-16 grid gap-x-6 gap-y-14 lg:mt-20 lg:grid-cols-2 lg:gap-x-10">
            {rest.map((post) => (
              <JournalEntryCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>

      <section className="border-t border-ink/10 bg-neutral-100/60">
        <div className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
          <p className="display max-w-2xl text-2xl leading-tight sm:text-3xl">
            La suite s&apos;écrit à l&apos;entraînement, pas dans un article.
          </p>
          <Link
            href="/commencer"
            className="eyebrow mt-8 inline-block border-b-2 border-accent pb-1 text-ink"
          >
            Comment commencer →
          </Link>
        </div>
      </section>
    </main>
  )
}

export default Journal
