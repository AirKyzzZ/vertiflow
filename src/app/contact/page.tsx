import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    "L'email direct pour écrire à VertiFlow, et les autres endroits où trouver la marque.",
  alternates: { canonical: '/contact' },
}

export function Contact() {
  return (
    <main>
      <div className="mx-auto max-w-[88rem] px-5 pt-16 lg:px-10 lg:pt-24">
        <header className="relative border-b border-ink/10 pb-10">
          <div className="flex items-baseline gap-4">
            <span className="eyebrow text-accent">Écrire</span>
            <h1 className="display min-w-0 wrap-anywhere text-[clamp(2.5rem,7vw,5rem)]">Contact</h1>
          </div>
          <p className="rule-marker relative mt-8 max-w-md pl-11 leading-relaxed text-neutral-700">
            Pas de formulaire pour l&apos;instant. Juste un email, et quelqu&apos;un qui
            répond de l&apos;autre côté.
          </p>
        </header>
      </div>

      <div className="mx-auto max-w-[88rem] px-5 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="display text-2xl leading-tight sm:text-3xl">
              Une question, une idée, une commande à corriger. Écris directement.
            </p>

            <div className="mt-10">
              <p className="eyebrow text-accent">Email direct</p>
              <a
                href="mailto:vertiflow.pro@gmail.com"
                className="mt-4 inline-block text-2xl leading-snug text-ink underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:text-accent sm:text-3xl"
              >
                vertiflow.pro@gmail.com
              </a>
              <p className="mt-6 max-w-sm leading-relaxed text-neutral-700">
                VertiFlow, c&apos;est une seule personne derrière l&apos;écran. Compte
                quelques jours pour une réponse, pas quelques minutes.
              </p>
            </div>
          </div>

          <div className="space-y-10 border-t border-ink/10 pt-10 lg:border-t-0 lg:border-l lg:border-ink/10 lg:pl-16 lg:pt-0">
            <div>
              <p className="eyebrow text-accent">Instagram</p>
              <a
                href="https://www.instagram.com/vertiflowfreerun/"
                className="mt-3 inline-block text-lg text-ink underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:text-accent"
              >
                @vertiflowfreerun
              </a>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
                Le plus rapide pour un message court.
              </p>
            </div>

            <div>
              <p className="eyebrow text-accent">Une question sur une commande ?</p>
              <p className="mt-3 max-w-sm leading-relaxed text-neutral-700">
                La FAQ répond déjà à la plupart des questions sur la livraison, les
                tailles et les retours.
              </p>
              <Link
                href="/faq"
                className="eyebrow mt-3 inline-block border-b-2 border-accent pb-1 text-ink"
              >
                Voir la FAQ →
              </Link>
            </div>

            <div>
              <p className="eyebrow text-accent">Informations légales</p>
              <p className="mt-3 max-w-sm leading-relaxed text-neutral-700">
                SIRET, CGV, données personnelles : tout est sur les pages légales.
              </p>
              <Link
                href="/mentions-legales"
                className="eyebrow mt-3 inline-block border-b-2 border-accent pb-1 text-ink"
              >
                Mentions légales →
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-ink/10 pt-16 lg:mt-20 lg:pt-20">
          <p className="max-w-md leading-relaxed text-neutral-700">
            Envie de savoir d&apos;où vient la marque avant d&apos;écrire ?
          </p>
          <Link href="/a-propos" className="eyebrow border-b-2 border-accent pb-1 text-ink">
            À propos →
          </Link>
        </section>
      </div>
    </main>
  )
}

export default Contact
