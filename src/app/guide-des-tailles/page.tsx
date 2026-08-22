import type { Metadata } from 'next'
import Link from 'next/link'
import { oneSizeProducts, sizedProducts } from './size-data'
import { SizeTable } from './size-table'

export const metadata: Metadata = {
  title: 'Guide des tailles',
  description:
    'Comment te mesurer et choisir ta taille sur les 9 pièces VertiFlow, avec les mensurations réelles de chaque gabarit.',
}

const measuringPoints = [
  {
    label: 'Poitrine',
    instruction: 'Autour de la partie la plus large de la poitrine, sous les bras.',
  },
  {
    label: 'Taille',
    instruction: "À l'endroit le plus étroit, en général juste au-dessus du nombril.",
  },
  {
    label: 'Hanches',
    instruction: 'Départ à une hanche, en passant par la partie la plus large, retour au même point.',
  },
  {
    label: 'Tour de tête',
    instruction: 'Sur le front, environ 2,5 cm au-dessus des oreilles, tout autour.',
  },
]

export function GuideDesTaillesPage() {
  return (
    <main>
      <div className="mx-auto max-w-[88rem] px-5 pt-16 lg:px-10 lg:pt-24">
        <header className="relative border-b border-ink/10 pb-10">
          <div className="flex items-baseline gap-4">
            <span className="eyebrow text-accent">Boutique</span>
            <h1 className="display text-[clamp(2.5rem,7vw,5rem)]">Guide des tailles</h1>
          </div>
          <p className="rule-marker relative mt-8 max-w-xl pl-11 leading-relaxed text-neutral-700">
            Neuf pièces, imprimées à la demande sur les gabarits réels du fabricant. Voici
            comment choisir la bonne taille du premier coup, mesures en centimètres, à
            prendre toi-même.
          </p>
        </header>
      </div>

      <div className="mx-auto max-w-[88rem] px-5 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          <section>
            <h2 className="display text-2xl sm:text-3xl">Comment te mesurer</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-neutral-700">
              Un mètre de couturière, un miroir, si possible quelqu&apos;un pour t&apos;aider.
              Mesure par-dessus un sous-vêtement ou un vêtement fin, mètre à l&apos;horizontale,
              ni serré ni lâche.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6">
              {measuringPoints.map((point) => (
                <div key={point.label}>
                  <dt className="eyebrow rule-marker relative pl-8 text-neutral-500">
                    {point.label}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-neutral-700">
                    {point.instruction}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="display text-2xl sm:text-3xl">Entre deux tailles ?</h2>
            <div className="mt-4 max-w-lg space-y-4 leading-relaxed text-neutral-700">
              <p>
                Prends la taille au-dessus si tu veux de l&apos;aisance pour bouger, sauf sur
                une pièce ajustée comme le débardeur, où c&apos;est l&apos;inverse. Les notes de
                chaque pièce, plus bas, précisent.
              </p>
              <p>
                Les mesures viennent du fabricant. Une pièce imprimée à la demande n&apos;est
                jamais coupée au millimètre : compte une variation possible de quelques
                centimètres d&apos;un exemplaire à l&apos;autre.
              </p>
            </div>
          </section>
        </div>

        <section className="mt-16 border-t border-ink/10 pt-16 lg:mt-20 lg:pt-20">
          <h2 className="display text-2xl sm:text-3xl">Est-ce que ça bouge avec toi ?</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-neutral-700">
            Les shorts Performance et Confort sont en polyester extensible : ils suivent le
            mouvement et sèchent vite, pensés pour la séance. Le t-shirt, le hoodie et le
            débardeur sont en coton, sans élasthanne, parfaits avant et après une session,
            moins faits pour l&apos;échauffement intensif. Le cache-cou est en microfibre
            stretch : cache-cou, bandana ou bonnet fin, comme tu veux.
          </p>
        </section>

        <section className="mt-16 border-t border-ink/10 pt-16 lg:mt-20 lg:pt-20">
          <h2 className="display text-2xl sm:text-3xl">Les tailles, pièce par pièce</h2>
          <div className="mt-10 divide-y divide-ink/10">
            {sizedProducts.map((product) => (
              <article key={product.slug} className="py-10 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <h3 className="display text-xl sm:text-2xl">{product.name}</h3>
                  <Link
                    href={`/boutique/${product.slug}`}
                    className="eyebrow border-b-2 border-accent pb-1 text-ink"
                  >
                    Voir la fiche →
                  </Link>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
                  {product.fit} {product.fabric}
                </p>
                {product.note && (
                  <p className="eyebrow mt-3 max-w-md text-accent">{product.note}</p>
                )}
                <div className="mt-6">
                  <SizeTable sizes={product.sizes} measurements={product.measurements} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-ink/10 pt-16 lg:mt-20 lg:pt-20">
          <h2 className="display text-2xl sm:text-3xl">Taille unique, en vrai</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-neutral-700">
            Trois pièces n&apos;ont qu&apos;une taille. Voici ce que ça veut dire, concrètement,
            pour chacune.
          </p>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {oneSizeProducts.map((product) => (
              <div key={product.slug}>
                <span className="eyebrow text-accent">{product.mechanism}</span>
                <h3 className="display mt-2 text-lg">{product.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700">{product.fit}</p>
                <Link
                  href={`/boutique/${product.slug}`}
                  className="eyebrow mt-4 inline-block border-b-2 border-accent pb-1 text-ink"
                >
                  Voir la fiche →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-ink/10 pt-16 lg:mt-20 lg:pt-20">
          <h2 className="display text-2xl sm:text-3xl">Coque iPhone VF</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-neutral-700">
            Pas une question de mensurations : choisis simplement ton modèle d&apos;iPhone
            dans le sélecteur, sur la fiche produit.
          </p>
          <Link
            href="/boutique/coque-iphone-vf"
            className="eyebrow mt-4 inline-block border-b-2 border-accent pb-1 text-ink"
          >
            Voir la fiche →
          </Link>
        </section>

        <section className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-ink/10 pt-16 lg:mt-20 lg:pt-20">
          <p className="max-w-md leading-relaxed text-neutral-700">
            Toujours un doute ?{' '}
            <a href="mailto:vertiflow.pro@gmail.com" className="text-accent underline">
              Écris avant de commander
            </a>
            .
          </p>
          <Link
            href="/boutique"
            className="eyebrow border-b-2 border-accent pb-1 text-ink"
          >
            Toute la boutique →
          </Link>
        </section>
      </div>
    </main>
  )
}

export default GuideDesTaillesPage
