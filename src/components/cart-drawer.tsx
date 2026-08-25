'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/components/cart-provider'
import { useCartDrawer } from '@/components/cart-drawer-provider'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { canDecreaseQuantity, canIncreaseQuantity } from '@/lib/cart'
import { cartTotal, priceLines, SHIPPING_DISCLOSURE, type ProductSummary } from '@/lib/cart-pricing'
import { formatPrice, getDictionary, localeFromPathname, SHOP_PATHS, type Dictionary } from '@/lib/i18n'
import { isRealPhoto } from '@/lib/product-media'

type CartDrawerProps = {
  products: ProductSummary[]
}

type QuantityStepperProps = {
  quantity: number
  productName: string
  dict: Dictionary['cart']
  onChange: (quantity: number) => void
}

function QuantityStepper({ quantity, productName, dict, onChange }: QuantityStepperProps) {
  return (
    <div className="flex divide-x divide-ink/15 border border-ink/15">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={!canDecreaseQuantity(quantity)}
        aria-label={dict.decreaseLabelTemplate.replace('{name}', productName)}
        className="eyebrow px-3 py-2 text-ink transition-colors hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        −
      </button>
      <span
        aria-live="polite"
        className="eyebrow flex min-w-9 items-center justify-center bg-ink px-2 py-2 text-paper"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={!canIncreaseQuantity(quantity)}
        aria-label={dict.increaseLabelTemplate.replace('{name}', productName)}
        className="eyebrow px-3 py-2 text-ink transition-colors hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        +
      </button>
    </div>
  )
}

export function CartDrawer({ products }: CartDrawerProps) {
  const pathname = usePathname()
  const locale = localeFromPathname(pathname)
  const dict = getDictionary(locale).cart
  const { lines, ready, setQuantity, remove } = useCart()
  const { open, setOpen, cancelAutoClose, restoreFocusToTrigger } = useCartDrawer()

  const priced = priceLines(lines, products)
  const subtotal = cartTotal(priced)
  const isEmpty = !ready || lines.length === 0

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        id="cart-drawer"
        onPointerEnter={cancelAutoClose}
        onFocusCapture={cancelAutoClose}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          restoreFocusToTrigger()
        }}
      >
        <SheetHeader>
          <SheetTitle>{dict.title}</SheetTitle>
          <SheetDescription className="sr-only">{dict.description}</SheetDescription>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <p className="display text-2xl">{dict.emptyTitle}</p>
            <p className="max-w-xs text-sm leading-relaxed text-neutral-600">
              {dict.emptyBodyTemplate.replace('{count}', String(products.length))}
            </p>
            <SheetClose asChild>
              <Link
                href={SHOP_PATHS[locale]}
                className="eyebrow mt-2 inline-block bg-accent px-8 py-4 text-ink transition-transform hover:-translate-y-0.5"
              >
                {dict.emptyCta}
              </Link>
            </SheetClose>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-6">
              {priced.map(({ line, name, total, image }, index) => (
                <li key={`${line.slug}-${line.color}-${line.size}`} className="flex gap-4 py-5">
                  <div className="grain relative h-20 w-16 shrink-0 overflow-hidden bg-neutral-100">
                    {image && (
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="80px"
                        className={isRealPhoto(image) ? 'object-cover' : 'object-contain p-2'}
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="display text-base leading-tight">{name}</p>
                      <p className="eyebrow mt-1 text-neutral-500">
                        {line.color} · {line.size}
                      </p>
                      {total === null && <p className="eyebrow mt-1 text-accent">{dict.unavailable}</p>}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <QuantityStepper
                        quantity={line.quantity}
                        productName={name}
                        dict={dict}
                        onChange={(quantity) => setQuantity(index, quantity)}
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label={dict.removeLabelTemplate.replace('{name}', name)}
                        className="eyebrow text-neutral-500 transition-colors hover:text-ink"
                      >
                        {dict.removeAction}
                      </button>
                    </div>
                  </div>

                  <p className="eyebrow whitespace-nowrap pt-0.5 text-neutral-700">
                    {total === null ? '—' : formatPrice(total, locale)}
                  </p>
                </li>
              ))}
            </ul>

            <SheetFooter>
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-neutral-500">{dict.subtotalLabel}</span>
                <span className="display text-2xl">{formatPrice(subtotal, locale)}</span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500">
                {SHIPPING_DISCLOSURE}{' '}
                <SheetClose asChild>
                  <Link href="/livraison-et-paiement" className="text-accent underline">
                    {dict.shippingLink}
                  </Link>
                </SheetClose>
              </p>
              <SheetClose asChild>
                <Link
                  href="/commande"
                  className="eyebrow block bg-accent px-8 py-4 text-center text-ink transition-transform hover:-translate-y-0.5"
                >
                  {dict.checkoutCta}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/panier" className="eyebrow block text-center text-neutral-500 transition-colors hover:text-ink">
                  {dict.viewFullCart}
                </Link>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
