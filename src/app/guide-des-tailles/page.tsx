import type { Metadata } from 'next'
import Link from 'next/link'
import { Fragment } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { oneSizeProducts, sizedProducts } from './size-data'
import { SizeTable } from './size-table'

type GarmentTab =
  | { kind: 'sized'; product: (typeof sizedProducts)[number] }
  | { kind: 'oneSize'; product: (typeof oneSizeProducts)[number] }

const garmentGroups: { label: string; slugs: string[] }[] = [
  { label: 'Hauts', slugs: ['tshirt-climb', 'hoodie-vf-definition', 'debardeur-vf'] },
  { label: 'Bas', slugs: ['shorts-performance-vf', 'short-confort-vf'] },
  { label: 'Accessoires', slugs: ['casquette-vf', 'bob-vf', 'cache-cou-vf'] },
]

function findGarment(slug: string): GarmentTab {
  const sized = sizedProducts.find((product) => product.slug === slug)
  if (sized) return { kind: 'sized', product: sized }
  const oneSize = oneSizeProducts.find((product) => product.slug === slug)
  if (oneSize) return { kind: 'oneSize', product: oneSize }
  throw new Error(`guide-des-tailles: unknown garment slug "${slug}"`)
}

const garmentTabs = garmentGroups.flatMap((group) =>
  group.slugs.map((slug) => ({ group: group.label, ...findGarment(slug) })),
)

export const metadata: Metadata = {
  title: 'Guide des tailles',
  description:
    'Comment te mesurer et choisir ta taille sur les 9 pièces VertiFlow, avec les mensurations réelles de chaque gabarit.',
  alternates: { canonical: '/guide-des-tailles' },
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
            <h1 className="display min-w-0 wrap-anywhere text-[clamp(2.5rem,7vw,5rem)]">Guide des tailles</h1>
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
          <p className="mt-4 max-w-2xl leading-relaxed text-neutral-700">
            Trois pièces n&apos;ont qu&apos;une taille. Voici ce que ça veut dire, concrètement,
            pour chacune.
          </p>

          <Tabs defaultValue={garmentTabs[0].product.slug} className="mt-10">
            <div className="overflow-x-auto pb-2">
              <TabsList variant="line" aria-label="Choisir une pièce">
                {garmentGroups.map((group, groupIndex) => (
                  <Fragment key={group.label}>
                    {groupIndex > 0 && (
                      <span
                        aria-hidden="true"
                        className="mx-1 h-5 w-px shrink-0 self-center bg-ink/10"
                      />
                    )}
                    {group.slugs.map((slug) => {
                      const garment = findGarment(slug)
                      return (
                        <TabsTrigger key={slug} value={slug} className="shrink-0">
                          {garment.product.name}
                        </TabsTrigger>
                      )
                    })}
                  </Fragment>
                ))}
              </TabsList>
            </div>

            {garmentTabs.map(({ kind, product }) => (
              <TabsContent
                key={product.slug}
                value={product.slug}
                forceMount
                className="mt-8 data-[state=inactive]:hidden"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="display min-w-0 wrap-anywhere text-xl sm:text-2xl">
                      {product.name}
                    </h3>
                    {kind === 'oneSize' && <Badge variant="outline">Taille unique</Badge>}
                  </div>
                  <Link
                    href={`/boutique/${product.slug}`}
                    className="eyebrow border-b-2 border-accent pb-1 text-ink"
                  >
                    Voir la fiche →
                  </Link>
                </div>

                {kind === 'sized' ? (
                  <>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
                      {product.fit} {product.fabric}
                    </p>
                    {product.note && (
                      <p className="eyebrow mt-3 max-w-md text-accent">{product.note}</p>
                    )}
                    <div className="mt-6">
                      <SizeTable sizes={product.sizes} measurements={product.measurements} />
                    </div>
                  </>
                ) : (
                  <>
                    <span className="eyebrow mt-3 inline-block text-accent">{product.mechanism}</span>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
                      {product.fit}
                    </p>
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
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
