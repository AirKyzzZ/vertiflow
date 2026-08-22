import Link from 'next/link'

export function Annulee() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-32 text-center lg:px-10">
      <p className="eyebrow text-accent">Statut</p>
      <h1 className="display mt-5 text-[clamp(2.5rem,7vw,4.5rem)]">Paiement annulé</h1>
      <p className="mt-6 leading-relaxed text-neutral-700">
        Rien n&apos;a été débité. Ton panier est toujours là, tu peux reprendre la commande quand tu veux.
      </p>
      <Link
        href="/panier"
        className="eyebrow mt-12 inline-block bg-accent px-8 py-4 text-ink transition-transform hover:-translate-y-0.5"
      >
        Retour au panier
      </Link>
    </main>
  )
}

export default Annulee
