'use client'

import Link from 'next/link'
import { useCart } from '@/components/cart-provider'
import { getDictionary, type Locale } from '@/lib/i18n'

type CartCountProps = {
  locale: Locale
}

export function CartCount({ locale }: CartCountProps) {
  const { count, ready } = useCart()
  const dict = getDictionary(locale)

  return (
    <Link href="/panier" className="eyebrow text-neutral-700 transition-colors hover:text-ink">
      {dict.nav.cart}{ready && count > 0 ? ` (${count})` : ''}
    </Link>
  )
}
