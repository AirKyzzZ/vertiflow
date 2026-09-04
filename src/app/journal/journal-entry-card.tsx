import Image from 'next/image'
import Link from 'next/link'
import type { JournalPost } from '@/app/journal/journal-data'

type JournalEntryCardProps = {
  post: JournalPost
  featured?: boolean
}

export function JournalEntryCard({ post, featured = false }: JournalEntryCardProps) {
  return (
    <Link href={`/journal/${post.slug}`} className="group block">
      <div
        className={`grain relative overflow-hidden bg-neutral-100 ${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}
      >
        <Image
          src={post.image}
          alt={post.imageAlt}
          fill
          sizes={featured ? '100vw' : '(min-width: 1024px) 45vw, 90vw'}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className={featured ? 'mt-6 max-w-2xl' : 'mt-5'}>
        <span className="eyebrow text-neutral-500">{post.date}</span>
        <h2
          className={`display mt-3 ${featured ? 'text-3xl sm:text-5xl' : 'text-xl lg:text-2xl'}`}
        >
          {post.title}
        </h2>
        <p
          className={`mt-3 leading-relaxed text-neutral-700 ${featured ? 'text-base' : 'text-sm'}`}
        >
          {post.standfirst}
        </p>
        <span className="mt-4 block h-px w-0 bg-accent transition-all duration-500 group-hover:w-10" />
      </div>
    </Link>
  )
}
