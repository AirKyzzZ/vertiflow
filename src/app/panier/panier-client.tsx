'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/cart-provider'
import { cartTotal, priceLines, SHIPPING_DISCLOSURE, type ProductSummary } from '@/lib/cart-pricing'
import { formatPrice, type Locale } from '@/lib/i18n'
import { isRealPhoto } from '@/lib/product-media'

type PanierClientProps = {
  products: ProductSummary[]
  locale?: Locale
}

type QuantityStepperProps = {
  quantity: number
  productName: string
  onChange: (quantity: number) => void
}

function QuantityStepper({ quantity, productName, onChange }: QuantityStepperProps) {
  return (
    <div className="flex divide-x divide-ink/15 border border-ink/15">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= 1}
        aria-label={`Diminuer la quantité de ${productName}`}
        className="eyebrow px-4 py-3 text-ink transition-colors hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        −
      </button>
      <span
        aria-live="polite"
        className="eyebrow flex min-w-11 items-center justify-center bg-ink px-2 py-3 text-paper"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= 10}
        aria-label={`Augmenter la quantité de ${productName}`}
        className="eyebrow px-4 py-3 text-ink transition-colors hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        +
      </button>
    </div>
  )
}

export function PanierClient({ products, locale = 'fr' }: PanierClientProps) {
  const { lines, ready, setQuantity, remove } = useCart()

  const priced = priceLines(lines, products)
  const total = cartTotal(priced)

  if (!ready) return <main className="min-h-[60vh]" />

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-32 text-center lg:px-10">
        <p className="eyebrow text-accent">Panier</p>
        <h1 className="display mt-4 text-[clamp(2.25rem,6vw,3.5rem)]">Vide pour l&apos;instant</h1>
        <p className="mt-5 text-neutral-700">
          La boutique compte {products.length} pièces, imprimées à la demande.
        </p>
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
          <span className="eyebrow text-accent">01</span>
          <h1 className="display min-w-0 wrap-anywhere text-[clamp(2.5rem,7vw,4.5rem)]">Panier</h1>
        </div>
        <p className="rule-marker relative mt-8 max-w-md pl-11 leading-relaxed text-neutral-700">
          Imprimé et expédié à la demande. Compte 5 à 10 jours ouvrés.
        </p>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {priced.map(({ line, name, total: lineTotal, image }, index) => (
            <li key={`${line.slug}-${line.color}-${line.size}`} className="flex gap-5 py-8 sm:gap-8">
              <div className="grain relative h-28 w-24 shrink-0 overflow-hidden bg-neutral-100 sm:h-32 sm:w-28">
                {image && (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="128px"
                    className={isRealPhoto(image) ? 'object-cover' : 'object-contain p-3'}
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="display text-lg">{name}</p>
                  <p className="eyebrow mt-2 text-neutral-500">
                    {line.color} · {line.size}
                  </p>
                  {lineTotal === null && (
                    <p className="eyebrow mt-2 text-accent">Indisponible</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-5">
                  <QuantityStepper
                    quantity={line.quantity}
                    productName={name}
                    onChange={(quantity) => setQuantity(index, quantity)}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Retirer ${name} du panier`}
                    className="eyebrow text-neutral-500 transition-colors hover:text-ink"
                  >
                    Retirer
                  </button>
                </div>
              </div>

              <p className="eyebrow whitespace-nowrap pt-1 text-neutral-700">
                {lineTotal === null ? '—' : formatPrice(lineTotal, locale)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="border border-ink/10 bg-neutral-100/60 p-6 lg:sticky lg:top-24 lg:self-start">
          <span className="eyebrow text-neutral-500">Sous-total</span>
          <p className="display mt-2 text-3xl">{formatPrice(total, locale)}</p>
          <p className="mt-3 text-xs leading-relaxed text-neutral-500">
            {SHIPPING_DISCLOSURE}{' '}
            <Link href="/livraison-et-paiement" className="text-accent underline">
              Voir les délais et tarifs
            </Link>
          </p>
          <Link
            href="/commande"
            className="eyebrow mt-8 block bg-accent px-8 py-4 text-center text-ink transition-transform hover:-translate-y-0.5"
          >
            Commander
          </Link>
        </aside>
      </div>
    </main>
  )
}
