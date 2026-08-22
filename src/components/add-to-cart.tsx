'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/cart-provider'

type AddToCartProps = {
  slug: string
  colour: string
  size: string
}

export function AddToCart({ slug, colour, size }: AddToCartProps) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => {
          add({ slug, color: colour, size, quantity: 1 })
          setAdded(true)
        }}
        className="eyebrow w-full bg-accent px-8 py-4 text-ink transition-transform hover:-translate-y-0.5"
      >
        Ajouter au panier
      </button>

      <span role="status" aria-live="polite" className="sr-only">
        {added ? 'Ajouté au panier.' : ''}
      </span>

      {added && (
        <Link href="/panier" className="eyebrow mt-4 block text-center text-accent underline">
          Voir le panier →
        </Link>
      )}
    </div>
  )
}
