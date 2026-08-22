'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/cart-provider'
import type { Dictionary } from '@/lib/i18n'

type AddToCartProps = {
  slug: string
  colour: string
  size: string
  dict: Dictionary['product']
}

export function AddToCart({ slug, colour, size, dict }: AddToCartProps) {
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
        {dict.addToCart}
      </button>

      <span role="status" aria-live="polite" className="sr-only">
        {added ? dict.addedToCart : ''}
      </span>

      {added && (
        <Link href="/panier" className="eyebrow mt-4 block text-center text-accent underline">
          {dict.viewCart}
        </Link>
      )}
    </div>
  )
}
