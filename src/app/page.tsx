import Image from 'next/image'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { getProducts } from '@/lib/catalogue'

const timeline = [
  { when: '8 ans', what: 'FFG, niveau national' },
  { when: 'nov. 2024', what: 'VertiFlow' },
  { when: 'juil. 2025', what: 'PKBA, association loi 1901' },
  { when: '—', what: 'Reportage France 3 Nouvelle-Aquitaine' },
  { when: "aujourd'hui", what: '80+ licenciés' },
]

function SectionNumber({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="eyebrow text-accent">{n}</span>
      <h2 className="display text-3xl sm:text-4xl">{title}</h2>
    </div>
  )
}

export function Home() {
  const products = getProducts()

  return (
    <main>
      <section className="grain relative isolate flex min-h-[86vh] items-end overflow-hidden bg-ink text-paper">
        <Image
          src="/images/slideshow/banner.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-40"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />

        <div className="mx-auto w-full max-w-[88rem] px-5 pb-16 lg:px-10 lg:pb-24">
          <p className="eyebrow text-accent">Bassin d&apos;Arcachon — depuis 2024</p>
          <h1 className="display mt-6 max-w-5xl text-[clamp(2.75rem,9vw,7.5rem)]">
            Apprends à passer,
            <br />
            pas à <span className="text-accent">contourner</span>.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-neutral-300">
            Huit ans de compétition. Un club de 80 licenciés. Des vêtements faits pour
            bouger, et tout ce qu&apos;il faut pour commencer.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/commencer"
              className="eyebrow bg-accent px-7 py-4 text-ink transition-transform hover:-translate-y-0.5"
            >
              Venir s&apos;entraîner
            </Link>
            <Link
              href="/boutique"
              className="eyebrow border border-paper/30 px-7 py-4 text-paper transition-colors hover:border-paper"
            >
              La boutique
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-32">
        <SectionNumber n="01" title="Commencer" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <p className="display text-2xl leading-tight sm:text-3xl">
            Tu n&apos;as besoin de rien savoir faire.
          </p>
          <div className="space-y-5 text-neutral-700">
            <p className="leading-relaxed">
              Personne n&apos;arrive en sachant. Le premier cours, tu vas rater des choses,
              et c&apos;est exactement ce qu&apos;on attend. On a des gens qui ont commencé
              le mois dernier.
            </p>
            <p className="leading-relaxed">
              Les séances se passent sur le Bassin, avec le club PKBA. La première est
              gratuite, et il n&apos;y a rien à payer pour venir voir.
            </p>
            <Link
              href="/commencer"
              className="eyebrow inline-block border-b-2 border-accent pb-1 text-ink"
            >
              Comment venir →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-neutral-100/60">
        <div className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionNumber n="02" title="L'essentiel" />
            <Link
              href="/boutique"
              className="eyebrow border-b-2 border-accent pb-1 text-ink"
            >
              Les {products.length} pièces →
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-32">
        <SectionNumber n="03" title="D'où ça vient" />
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div className="space-y-5 text-neutral-700">
            <p className="leading-relaxed">
              VertiFlow n&apos;est pas une marque de streetwear qui a choisi le parkour
              comme décor. Elle est née d&apos;un athlète FFG de niveau national qui a
              fondé un club, et le club existe toujours.
            </p>
            <p className="leading-relaxed">
              Une blessure a tout mis en pause. Revenir a été plus dur que commencer, et
              c&apos;est une des raisons pour lesquelles la porte reste ouverte ici.
            </p>
            <Link
              href="/a-propos"
              className="eyebrow inline-block border-b-2 border-accent pb-1 text-ink"
            >
              L&apos;histoire complète →
            </Link>
          </div>

          <dl className="divide-y divide-ink/10 border-y border-ink/10">
            {timeline.map((entry) => (
              <div key={entry.what} className="flex gap-6 py-4">
                <dt className="eyebrow w-28 shrink-0 pt-1 text-neutral-500">
                  {entry.when}
                </dt>
                <dd className="text-sm leading-relaxed">{entry.what}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  )
}

export default Home
