'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { CheckoutForm, type CheckoutStep } from '@/components/checkout-form'
import { useCart } from '@/components/cart-provider'
import { heroFor } from '@/lib/product-media'

export type ProductSummary = {
  slug: string
  name: string
  price: string
}

type CommandeClientProps = {
  products: ProductSummary[]
}

function findProduct(products: ProductSummary[], slug: string): ProductSummary | undefined {
  return products.find((product) => product.slug === slug)
}

function formatEuros(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} €`
}

export function CommandeClient({ products }: CommandeClientProps) {
  const { lines, ready } = useCart()
  const [promoCode, setPromoCode] = useState('')
  const [step, setStep] = useState<CheckoutStep>('idle')

  const priced = lines.map((line) => {
    const product = findProduct(products, line.slug)
    const unit = product ? Number(product.price) : 0
    return {
      line,
      name: product?.name ?? line.slug,
      total: unit * line.quantity,
      image: heroFor(line.slug, line.color),
    }
  })

  const total = priced.reduce((sum, entry) => sum + entry.total, 0)

  if (!ready) return <main className="min-h-[60vh]" />

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-32 text-center lg:px-10">
        <p className="eyebrow text-accent">Commande</p>
        <h1 className="display mt-4 text-[clamp(2.25rem,6vw,3.5rem)]">Panier vide</h1>
        <p className="mt-5 text-neutral-700">Ajoute une pièce avant de passer au paiement.</p>
        <Link
          href="/boutique"
          className="eyebrow mt-10 inline-block bg-accent px-8 py-4 text-ink transition-transform hover:-translate-y-0.5"
        >
          Voir la boutique
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-20 lg:px-10 lg:py-28">
      <header className="border-b border-ink/10 pb-10">
        <div className="flex items-baseline gap-4">
          <span className="eyebrow text-accent">03</span>
          <h1 className="display text-[clamp(2.5rem,7vw,4.5rem)]">Commande</h1>
        </div>
        <p className="rule-marker relative mt-8 max-w-md pl-11 leading-relaxed text-neutral-700">
          Paiement sécurisé par Stripe. Renseigne tes coordonnées pour finaliser.
        </p>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <CheckoutForm promoCode={promoCode} step={step} onStepChange={setStep} />

        <aside className="border border-ink/10 bg-neutral-100/60 p-6 lg:sticky lg:top-24 lg:self-start">
          <span className="eyebrow text-neutral-500">Résumé</span>

          <ul className="mt-4 space-y-4">
            {priced.map(({ line, name, total: lineTotal, image }) => (
              <li key={`${line.slug}-${line.color}-${line.size}`} className="flex items-start gap-4">
                <div className="grain relative h-16 w-14 shrink-0 overflow-hidden bg-paper">
                  {image && <Image src={image} alt="" fill sizes="56px" className="object-contain p-1.5" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="text-ink">{name}</p>
                  <p className="eyebrow mt-1 text-neutral-500">
                    {line.color} · {line.size} · x{line.quantity}
                  </p>
                </div>
                <p className="eyebrow whitespace-nowrap pt-1 text-neutral-700">{formatEuros(lineTotal)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-ink/10 pt-4">
            <span className="eyebrow text-neutral-500">Sous-total</span>
            <p className="display mt-2 text-3xl">{formatEuros(total)}</p>
            <p className="mt-3 text-xs leading-relaxed text-neutral-500">
              Frais de livraison calculés à l&apos;étape du paiement.
            </p>
          </div>

          {step === 'idle' ? (
            <details className="mt-6 border-t border-ink/10 pt-4">
              <summary className="eyebrow cursor-pointer text-neutral-500">J&apos;ai un code</summary>
              <input
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
                placeholder="Code promo"
                autoComplete="off"
                className="mt-3 w-full border border-ink/20 bg-paper px-4 py-3 text-sm outline-none focus:border-ink"
              />
            </details>
          ) : (
            <div className="mt-6 border-t border-ink/10 pt-4">
              <span className="eyebrow text-neutral-500">Code promo</span>
              <p className="mt-3 text-sm text-neutral-700">{promoCode || 'Aucun code appliqué'}</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}
