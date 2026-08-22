'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/components/cart-provider'

function Confirmation() {
  const sessionId = useSearchParams().get('session_id')
  const [paid, setPaid] = useState<boolean | null>(null)
  const { clear } = useCart()

  useEffect(() => {
    if (!sessionId) {
      setPaid(false)
      return
    }
    fetch('/api/checkout/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((response) => response.json())
      .then((payload) => {
        const isPaid = payload.paymentStatus === 'paid'
        setPaid(isPaid)
        if (isPaid) clear()
      })
      .catch(() => setPaid(false))
  }, [sessionId])

  return (
    <main className="mx-auto max-w-2xl px-5 py-32 text-center lg:px-10">
      <p className="eyebrow text-accent">{paid === null ? 'Vérification' : paid ? 'Commande confirmée' : 'Statut'}</p>
      <h1 className="display mt-5 text-[clamp(2.5rem,7vw,4.5rem)]">
        {paid === false ? 'Paiement non confirmé' : 'Merci'}
      </h1>
      <p className="mt-6 leading-relaxed text-neutral-700">
        {paid === false
          ? 'Si tu as été débité, écris-nous et on règle ça.'
          : 'Tu vas recevoir un email de confirmation. Compte 5 à 10 jours ouvrés.'}
      </p>
      <Link
        href="/boutique"
        className="eyebrow mt-12 inline-block bg-accent px-8 py-4 text-ink transition-transform hover:-translate-y-0.5"
      >
        Retour à la boutique
      </Link>
    </main>
  )
}

export function Succes() {
  return (
    <Suspense fallback={<main className="min-h-[60vh]" />}>
      <Confirmation />
    </Suspense>
  )
}

export default Succes
