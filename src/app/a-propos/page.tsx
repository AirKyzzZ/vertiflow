import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'À propos',
  description:
    "Huit ans de compétition, une blessure, et ce que ça a changé à la façon de faire des vêtements. Pourquoi VertiFlow existe, et ce qu'elle refuse d'être.",
  openGraph: {
    title: 'À propos',
    description:
      "Huit ans de compétition, une blessure, et ce que ça a changé à la façon de faire des vêtements.",
    images: [{ url: '/images/site/divider-seawall.webp', width: 2048, height: 1536 }],
  },
  alternates: { canonical: '/a-propos' },
}

const PKBA_URL = 'https://pkba.vertiflow.fr'

function ChapterHeading({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="eyebrow whitespace-nowrap text-accent">{n}</span>
      <h2 className="display min-w-0 wrap-anywhere text-3xl sm:text-4xl">{title}</h2>
    </div>
  )
}

export function APropos() {
  return (
    <main>
      <div className="mx-auto max-w-[88rem] px-5 pt-16 lg:px-10 lg:pt-24">
        <header className="relative border-b border-ink/10 pb-10">
          <div className="flex items-baseline gap-4">
            <span className="eyebrow text-accent">04</span>
            <h1 className="display min-w-0 wrap-anywhere text-[clamp(2.5rem,7vw,5rem)]">À propos</h1>
          </div>
          <p className="rule-marker relative mt-8 max-w-md pl-11 leading-relaxed text-neutral-700">
            Tu es sans doute déjà tombé sur une vidéo de parkour où tout semblait acquis
            d&apos;avance. Voici pourquoi VertiFlow existe, et ce qu&apos;elle refuse
            d&apos;être.
          </p>
        </header>
      </div>

      <section className="grain relative mt-14 aspect-[16/9] w-full overflow-hidden bg-ink lg:mt-20">
        <Image
          src="/images/site/divider-seawall.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <div className="absolute inset-x-5 bottom-10 lg:inset-x-10 lg:bottom-16">
          <p className="eyebrow text-accent">Bassin d&apos;Arcachon</p>
          <p className="display mt-4 max-w-lg text-3xl text-paper sm:text-4xl lg:text-5xl">
            Le soin se voit. Le débutant aussi.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
        <ChapterHeading n="Chapitre 1" title="Pour qui" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <p className="display text-2xl leading-tight sm:text-3xl">
            Pas pour ceux qui savent déjà.
          </p>
          <div className="space-y-5 text-neutral-700">
            <p className="leading-relaxed">
              Tu as déjà vu des vidéos de parkour. Une figure qui marche, jamais celle
              qui rate. Des corps qui ont l&apos;air d&apos;avoir commencé cinq ans avant
              que tu sois autorisé à essayer.
            </p>
            <p className="leading-relaxed">
              Cette page ne s&apos;adresse pas à l&apos;athlète qui s&apos;entraîne
              déjà — il n&apos;a pas besoin d&apos;être convaincu. Ni à qui veut juste le
              look sans le sport : VertiFlow lui vendra un hoodie avec plaisir, mais ce
              n&apos;est pas pour lui qu&apos;elle existe.
            </p>
            <p className="leading-relaxed">
              Elle s&apos;adresse à toi. Si tu ne sais toujours pas si tu peux le faire,
              la réponse honnête est oui — à partir d&apos;où tu en es.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-neutral-100/60">
        <div className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
          <ChapterHeading n="Chapitre 2" title="Ce que ça n'est pas" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            <p className="display text-2xl leading-tight sm:text-3xl">
              VertiFlow n&apos;est pas une marque de streetwear qui a choisi le parkour
              comme décor.
            </p>
            <div className="space-y-5 text-neutral-700">
              <p className="leading-relaxed">
                Huit ans de compétition sont venus avant la première pièce vendue. Si
                cette histoire disparaissait, il ne resterait qu&apos;un compte de
                streetwear générique parmi cent autres — et la marque se l&apos;interdit.
              </p>
              <p className="leading-relaxed">
                Elle s&apos;interdit aussi l&apos;intimidation. Des lignes parfaites, des
                corps déjà élite, jamais la chute. C&apos;est ce que postent la plupart
                des comptes parkour, et c&apos;est exactement ce qui tient les débutants
                à distance. Le soin apporté aux vêtements peut avoir l&apos;air pro — les
                gens qui les portent n&apos;ont pas à avoir l&apos;air inaccessibles.
              </p>
              <p className="leading-relaxed">
                Et elle s&apos;interdit d&apos;être un projet qui parle de lui-même.
                VertiFlow tourne à hauteur de quelques t-shirts par mois. Le chiffre qui
                compte n&apos;est pas celui des ventes, c&apos;est le nombre
                d&apos;inconnus qui se présentent pour s&apos;entraîner à cause
                d&apos;elle. Maxime n&apos;est pas le sujet de la marque. Toi, tu
                l&apos;es.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
        <ChapterHeading n="Chapitre 3" title="Le fondateur" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <p className="display text-2xl leading-tight sm:text-3xl">
            Huit ans de compétition. Une blessure. Un retour plus dur que tout le reste.
          </p>
          <div className="space-y-5 text-neutral-700">
            <p className="leading-relaxed">
              Maxime pratique la compétition de parkour depuis huit ans, niveau
              national, sous la FFG — la Fédération Française de Gymnastique, qui
              encadre le parkour en France. Ce n&apos;est pas une ligne de marketing.
              C&apos;est un parcours réel.
            </p>
            <p className="leading-relaxed">
              Huit ans à s&apos;entraîner, ça apprend surtout ce qui lâche : un tissu qui
              se déchire sur une réception, une coupe qui remonte pendant un saut de bras,
              une couture qui accroche au moment de passer un mur. En novembre 2024, il a
              commencé à corriger ça, pièce par pièce. VertiFlow est basée à Bordeaux, née
              de cette liste de détails, pas d&apos;une envie de vendre des t-shirts.
            </p>
            <p className="leading-relaxed">
              Puis une blessure a tout mis en pause. Revenir a pris plus de temps, et a
              été plus dur, que les huit années de compétition qui précédaient — de son
              propre aveu. C&apos;est aussi pour ça que la porte reste ouverte : celui
              qui a dû tout reconstruire ne juge pas une première séance ratée.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-neutral-100/60">
        <div className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
          <ChapterHeading n="Chapitre 4" title="Ce qu'il porte" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            <p className="display text-2xl leading-tight sm:text-3xl">
              Ce qu&apos;il porte à l&apos;entraînement, c&apos;est ce qu&apos;il vend.
            </p>
            <div className="space-y-5 text-neutral-700">
              <p className="leading-relaxed">
                L&apos;essentiel, ce sont les neuf pièces que VertiFlow vend
                aujourd&apos;hui : imprimées à la demande, pensées pour un corps qui
                bouge plus qu&apos;il ne pose. Rien de saisonnier, rien qui change parce
                que la mode a changé d&apos;avis.
              </p>
              <p className="leading-relaxed">
                À côté de la marque, il a aussi fondé un club : PKBA, une association loi
                1901 distincte, budgets séparés, aujourd&apos;hui plus de 80 licenciés.
                Pas la raison d&apos;être de VertiFlow — la preuve qu&apos;il construit
                des choses qui tiennent debout.
              </p>
              <a
                href={PKBA_URL}
                className="eyebrow inline-block border-b-2 border-accent pb-1 text-ink"
              >
                Voir le site du club →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
          <p className="eyebrow text-accent">La suite</p>
          <h2 className="display mt-4 max-w-2xl text-3xl sm:text-4xl lg:text-5xl">
            Envie de bouger, ou envie de porter la marque ?
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-neutral-700">
            Une première séance ou une pièce à porter — les deux commencent ici.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/commencer"
              className="eyebrow bg-accent px-7 py-4 text-ink transition-transform hover:-translate-y-0.5"
            >
              Venir s&apos;entraîner →
            </Link>
            <Link
              href="/boutique"
              className="eyebrow border border-ink/20 px-7 py-4 text-ink transition-colors hover:border-ink"
            >
              Voir L&apos;essentiel →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default APropos
