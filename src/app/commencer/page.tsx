import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Commencer',
  description:
    "Ce que c'est, si tu peux le faire, où, quand, combien — et si tu seras le pire du groupe. Tout, avant ta première séance sur le Bassin d'Arcachon.",
  openGraph: {
    title: 'Commencer',
    description:
      "Ce que c'est, si tu peux le faire, où, quand, combien — et si tu seras le pire du groupe.",
    images: [{ url: '/images/site/home-door.webp', width: 2048, height: 1536 }],
  },
  alternates: { canonical: '/commencer' },
}

const PKBA_URL = 'https://pkba.vertiflow.fr'

function QuestionHeading({ n, question }: { n: string; question: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="eyebrow whitespace-nowrap text-accent">{n}</span>
      <h2 className="display min-w-0 wrap-anywhere text-3xl sm:text-4xl">{question}</h2>
    </div>
  )
}

export function Commencer() {
  return (
    <main>
      <div className="mx-auto max-w-[88rem] px-5 pt-16 lg:px-10 lg:pt-24">
        <header className="relative border-b border-ink/10 pb-10">
          <div className="flex items-baseline gap-4">
            <span className="eyebrow text-accent">01</span>
            <h1 className="display min-w-0 wrap-anywhere text-[clamp(2.5rem,7vw,5rem)]">
              Commencer
            </h1>
          </div>
          <p className="rule-marker relative mt-8 max-w-md pl-11 leading-relaxed text-neutral-700">
            Tu as déjà vu des vidéos de parkour et tu t&apos;es dit que ce n&apos;était pas pour
            toi. Cette page répond aux questions qui te retiennent, dans l&apos;ordre où elles se
            posent.
          </p>
        </header>
      </div>

      <section className="grain relative mt-14 aspect-[16/9] w-full overflow-hidden bg-ink lg:mt-20">
        <Image
          src="/images/site/home-door.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <div className="absolute inset-x-5 bottom-10 lg:inset-x-10 lg:bottom-16">
          <p className="eyebrow text-accent">Bassin d&apos;Arcachon</p>
          <p className="display mt-4 max-w-lg text-3xl text-paper sm:text-4xl lg:text-5xl">
            La porte est ouverte. Il suffit de la pousser.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
        <QuestionHeading n="Question 1" question="C'est quoi ?" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <p className="display text-2xl leading-tight sm:text-3xl">
            Se déplacer dans son environnement en courant, en sautant, en grimpant. Rien de plus
            compliqué que ça, au départ.
          </p>
          <div className="space-y-5 text-neutral-700">
            <p className="leading-relaxed">
              Le parkour, c&apos;est passer d&apos;un point à un autre par le chemin le plus
              direct que ton corps peut trouver. Pas de chorégraphie, pas de juge, pas de
              spectacle.
            </p>
            <p className="leading-relaxed">
              VertiFlow, c&apos;est la marque de vêtements que tu es en train de lire. Le
              parkour, lui, se pratique pour de vrai sur le Bassin d&apos;Arcachon, avec le
              club PKBA — une association loi 1901, distincte de la marque.
            </p>
            <p className="leading-relaxed">
              Les deux existent grâce à la même personne : un athlète qui pratique le parkour en
              compétition depuis huit ans, niveau national (FFG). Deux structures séparées, un
              seul fondateur.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-neutral-100/60">
        <div className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
          <QuestionHeading n="Question 2" question="Est-ce que je peux le faire ?" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            <p className="display text-2xl leading-tight sm:text-3xl">
              Oui. Sans expérience, sans souplesse, sans avoir jamais fait de sport sérieusement.
            </p>
            <div className="space-y-5 text-neutral-700">
              <p className="leading-relaxed">
                Personne n&apos;arrive en sachant faire quoi que ce soit. Les 80+ licenciés du
                club ont tous commencé un jour à zéro, debout devant un obstacle, à se demander
                s&apos;ils allaient y arriver.
              </p>
              <p className="leading-relaxed">
                Pas besoin de matériel particulier : des vêtements dans lesquels tu bouges, des
                baskets, et c&apos;est tout. Pas besoin d&apos;un niveau de sport non plus — le
                club prend les gens là où ils en sont, pas là où il voudrait qu&apos;ils soient.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grain relative aspect-[16/9] w-full overflow-hidden bg-ink">
        <Image
          src="/images/photos/editorial/img-0740.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <div className="absolute inset-x-5 bottom-10 lg:inset-x-10 lg:bottom-16">
          <p className="eyebrow text-accent">Bordeaux</p>
          <p className="display mt-4 max-w-lg text-3xl text-paper sm:text-4xl lg:text-5xl">
            Personne n&apos;a l&apos;air prêt avant d&apos;essayer.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
        <QuestionHeading n="Question 3" question="Où ?" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <p className="display text-2xl leading-tight sm:text-3xl">
            Sur le Bassin d&apos;Arcachon. La Teste-de-Buch, Gujan-Mestras, Bordeaux — de vrais
            spots, pas
            un terrain vague générique.
          </p>
          <div className="space-y-5 text-neutral-700">
            <p className="leading-relaxed">
              Le club s&apos;entraîne dehors, sur ce qui existe déjà : escaliers, murets,
              rambardes. Pas de studio, pas de salle aseptisée.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-neutral-100/60">
        <div className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
          <QuestionHeading n="Question 4" question="Quand ?" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            <p className="display text-2xl leading-tight sm:text-3xl">
              Les horaires, c&apos;est PKBA qui les fixe — pas VertiFlow.
            </p>
            <div className="space-y-5 text-neutral-700">
              <p className="leading-relaxed">
                Les créneaux changent selon les groupes, les saisons et le spot. C&apos;est le
                club qui les gère, et lui seul : la marque de vêtements que tu es en train de
                lire n&apos;a pas de planning à te donner.
              </p>
              <a
                href={PKBA_URL}
                className="eyebrow inline-block border-b-2 border-accent pb-1 text-ink"
              >
                Voir les créneaux du club →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
        <QuestionHeading n="Question 5" question="Combien ça coûte ?" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <p className="display text-2xl leading-tight sm:text-3xl">
            La première séance ne coûte rien.
          </p>
          <div className="space-y-5 text-neutral-700">
            <p className="leading-relaxed">
              Tu viens, tu essaies, tu vois si ça te plaît. Rien à payer pour ça.
            </p>
            <p className="leading-relaxed">
              Si tu continues, il te faut une licence — et c&apos;est PKBA qui la délivre, pas
              VertiFlow. La marque fait des vêtements, le club fait cours. Deux structures
              séparées, et les tarifs de licence sont sur le site du club.
            </p>
            <a
              href={PKBA_URL}
              className="eyebrow inline-block border-b-2 border-accent pb-1 text-ink"
            >
              Voir les tarifs PKBA →
            </a>
          </div>
        </div>
      </section>

      <section className="grain bg-ink text-paper">
        <div className="mx-auto max-w-[88rem] px-5 py-24 lg:px-10 lg:py-36">
          <span className="eyebrow text-accent">Question 6</span>
          <h2 className="display mt-6 max-w-3xl text-[clamp(2.25rem,6vw,4.5rem)]">
            Tout le monde sera meilleur que moi ?
          </h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div className="space-y-5 text-neutral-300">
              <p className="leading-relaxed">Oui. Au début, sans doute.</p>
              <p className="leading-relaxed">
                Quelqu&apos;un sautera plus loin. Quelqu&apos;un atterrira plus propre.
                Quelqu&apos;un aura l&apos;air d&apos;avoir toujours su faire ça.
              </p>
              <p className="leading-relaxed">
                Cette personne aussi a commencé un jour en ratant tout. Ce que tu vois défiler
                sur Instagram, c&apos;est le meilleur essai sur cent, celui qui a fini par
                marcher. Une séance normale, c&apos;est surtout des ratés — les tiens y compris.
                C&apos;est même le signe que tu es en train d&apos;apprendre.
              </p>
            </div>
            <div>
              <p className="display text-2xl leading-tight text-paper sm:text-3xl">
                Les 80+ licenciés du club ne sont pas 80 athlètes.
              </p>
              <p className="mt-4 leading-relaxed text-neutral-300">
                Ce sont des gens qui ont continué à venir après leur première séance ratée.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
          <p className="eyebrow text-accent">La suite</p>
          <h2 className="display mt-4 max-w-2xl text-3xl sm:text-4xl lg:text-5xl">
            La première séance ne coûte rien et ne t&apos;engage à rien.
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-neutral-700">
            L&apos;inscription se fait chez PKBA, le club — pas ici. Tu quittes VertiFlow,
            direction le site du club.
          </p>
          <a
            href={PKBA_URL}
            className="eyebrow mt-8 inline-block bg-accent px-7 py-4 text-ink transition-transform hover:-translate-y-0.5"
          >
            Rejoindre PKBA →
          </a>
        </div>
      </section>
    </main>
  )
}

export default Commencer
