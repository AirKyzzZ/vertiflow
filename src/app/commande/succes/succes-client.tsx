'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { checkPaymentStatus, type PaymentStatus } from '@/lib/payment-status'

function fetchSessionStatus(sessionId: string) {
  return fetch('/api/checkout/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
}

const COPY: Record<PaymentStatus, { eyebrow: string; heading: string; body: string }> = {
  checking: {
    eyebrow: 'Vérification',
    heading: 'On vérifie ton paiement…',
    body: 'Ça peut prendre quelques instants. Si le prélèvement apparaît sur ton compte, ta commande est en cours de traitement.',
  },
  paid: {
    eyebrow: 'Commande confirmée',
    heading: 'Merci',
    body: 'Tu vas recevoir un email de confirmation. Compte 5 à 10 jours ouvrés.',
  },
  unpaid: {
    eyebrow: 'Statut',
    heading: 'Paiement non confirmé',
    body: 'Si tu as été débité, écris-nous et on règle ça.',
  },
}

function Confirmation() {
  const sessionId = useSearchParams().get('session_id')
  const [status, setStatus] = useState<PaymentStatus>('checking')

  useEffect(() => {
    if (!sessionId) {
      setStatus('unpaid')
      return
    }
    let cancelled = false
    checkPaymentStatus(sessionId, fetchSessionStatus).then((result) => {
      if (!cancelled) setStatus(result)
    })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  const { eyebrow, heading, body } = COPY[status]

  return (
    <main className="mx-auto max-w-2xl px-5 py-32 text-center lg:px-10">
      <p className="eyebrow text-accent">{eyebrow}</p>
      <h1 className="display mt-5 text-[clamp(2.5rem,7vw,4.5rem)]">{heading}</h1>
      <p className="mt-6 leading-relaxed text-neutral-700">{body}</p>
      <Link
        href="/boutique"
        className="eyebrow mt-12 inline-block bg-accent px-8 py-4 text-ink transition-transform hover:-translate-y-0.5"
      >
        Retour à la boutique
      </Link>
    </main>
  )
}

export function SuccesClient() {
  return (
    <Suspense fallback={<main className="min-h-[60vh]" />}>
      <Confirmation />
    </Suspense>
  )
}
