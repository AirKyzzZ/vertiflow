'use client'

import { toast } from 'sonner'
import { useCart } from '@/components/cart-provider'
import { useCartDrawer } from '@/components/cart-drawer-provider'
import type { Dictionary } from '@/lib/i18n'

type AddToCartProps = {
  slug: string
  name: string
  colour: string
  size: string
  dict: Dictionary['product']
  cartDict: Dictionary['cart']
}

export function AddToCart({ slug, name, colour, size, dict, cartDict }: AddToCartProps) {
  const { add } = useCart()
  const { openOnAdd } = useCartDrawer()

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => {
          add({ slug, color: colour, size, quantity: 1 })
          openOnAdd()
          toast(cartDict.toastAddedTemplate.replace('{name}', name))
        }}
        aria-controls="cart-drawer"
        className="eyebrow w-full bg-accent px-8 py-4 text-ink transition-transform hover:-translate-y-0.5"
      >
        {dict.addToCart}
      </button>
    </div>
  )
}
