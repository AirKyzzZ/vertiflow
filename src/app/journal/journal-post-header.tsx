import Image from 'next/image'
import Link from 'next/link'

type JournalPostHeaderProps = {
  date: string
  title: string
  image?: string
  imageAlt?: string
}

export function JournalPostHeader({ date, title, image, imageAlt }: JournalPostHeaderProps) {
  return (
    <section className="grain relative isolate flex min-h-[52vh] items-end overflow-hidden bg-ink text-paper">
      {image && (
        <>
          <Image
            src={image}
            alt={imageAlt ?? ''}
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/65 to-ink/15" />
        </>
      )}
      <div className="mx-auto w-full max-w-[88rem] px-5 pb-14 lg:px-10 lg:pb-20">
        <Link
          href="/journal"
          className="eyebrow text-paper/70 transition-colors hover:text-paper"
        >
          ← Journal
        </Link>
        <p className="eyebrow mt-6 text-accent">{date}</p>
        <h1 className="display mt-4 max-w-4xl text-[clamp(2.25rem,6vw,4.5rem)]">{title}</h1>
      </div>
    </section>
  )
}
