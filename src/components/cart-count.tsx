'use client'

import { useCart } from '@/components/cart-provider'
import { useCartDrawer } from '@/components/cart-drawer-provider'
import { getDictionary, type Locale } from '@/lib/i18n'

type CartCountProps = {
  locale: Locale
}

export function CartCount({ locale }: CartCountProps) {
  const { count, ready } = useCart()
  const { open, setOpen } = useCartDrawer()
  const dict = getDictionary(locale)

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-expanded={open}
      aria-controls="cart-drawer"
      className="eyebrow text-neutral-700 transition-colors hover:text-ink"
    >
      {dict.nav.cart}{ready && count > 0 ? ` (${count})` : ''}
    </button>
  )
}
