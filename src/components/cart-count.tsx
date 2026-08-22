'use client'

import Link from 'next/link'
import { useCart } from '@/components/cart-provider'

export function CartCount() {
  const { count, ready } = useCart()

  return (
    <Link href="/panier" className="eyebrow text-neutral-700 transition-colors hover:text-ink">
      Panier{ready && count > 0 ? ` (${count})` : ''}
    </Link>
  )
}
