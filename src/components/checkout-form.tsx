'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangleIcon } from 'lucide-react'
import { formatPrice, type Locale } from '@/lib/i18n'
import { loadStripe } from '@stripe/stripe-js'
import type {
  StripeCheckoutElementsSdk,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutSession,
  StripePaymentElement,
} from '@stripe/stripe-js'
import { useCart } from '@/components/cart-provider'
import {
  checkoutSchema,
  COUNTRIES,
  DEFAULT_COUNTRY,
  STATE_REQUIRED_COUNTRIES,
  type CheckoutFormValues,
} from '@/lib/checkout-schema'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type CheckoutStep = 'idle' | 'creating' | 'ready' | 'confirming'

const fieldClass = 'h-auto w-full rounded-none border-ink/20 bg-paper px-4 py-3 text-sm focus-visible:border-ink focus-visible:ring-0'
const labelClass = 'eyebrow text-neutral-500'

function countryLabel(code: string): string {
  return COUNTRIES.find((country) => country.code === code)?.label ?? code
}

type CheckoutTotals = {
  total: number
  shipping: number
}

function sessionTotals(session: StripeCheckoutSession): CheckoutTotals {
  return {
    total: session.total.total.minorUnitsAmount / 100,
    shipping: session.total.shippingRate.minorUnitsAmount / 100,
  }
}

type CheckoutFormProps = {
  promoCode: string
  step: CheckoutStep
  onStepChange: (step: CheckoutStep) => void
  locale?: Locale
}

export function CheckoutForm({ promoCode, step, onStepChange, locale = 'fr' }: CheckoutFormProps) {
  const { lines, clear } = useCart()
  const router = useRouter()
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: DEFAULT_COUNTRY,
      state: '',
    },
  })
  const [error, setError] = useState<string | null>(null)
  const [canConfirm, setCanConfirm] = useState(false)
  const [totals, setTotals] = useState<CheckoutTotals | null>(null)
  const actionsRef = useRef<StripeCheckoutLoadActionsSuccess | null>(null)
  const activeCheckoutRef = useRef<{ checkout: StripeCheckoutElementsSdk; paymentElement: StripePaymentElement } | null>(null)

  const country = form.watch('country')
  const summary = form.getValues()
  const needsState = STATE_REQUIRED_COUNTRIES.has(country)

  function handleEdit() {
    activeCheckoutRef.current?.paymentElement.destroy()
    activeCheckoutRef.current = null
    actionsRef.current = null
    setCanConfirm(false)
    setError(null)
    onStepChange('idle')
  }

  async function onSubmit(values: CheckoutFormValues) {
    if (step !== 'idle') return
    setError(null)
    onStepChange('creating')

    const customer = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      address: {
        line1: values.line1,
        line2: values.line2,
        city: values.city,
        postal_code: values.postalCode,
        country: values.country,
        state: values.state,
      },
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines, customer, promoCode }),
      })
      const payload = await response.json()
      if (response.status === 400) throw new Error('invalid-customer-details')
      if (!response.ok) throw new Error('request-failed')

      const stripe = await loadStripe(payload.publishableKey, { locale })
      if (!stripe) throw new Error('stripe-unavailable')

      const checkout = stripe.initCheckoutElementsSdk({ clientSecret: payload.clientSecret })
      checkout.on('change', (session) => {
        if (activeCheckoutRef.current?.checkout !== checkout) return
        setCanConfirm(session.canConfirm)
        setTotals(sessionTotals(session))
      })

      const paymentElement = checkout.createPaymentElement()
      paymentElement.mount('#payment-element')
      activeCheckoutRef.current = { checkout, paymentElement }

      const loadResult = await checkout.loadActions()
      if (loadResult.type === 'error') throw new Error('actions-unavailable')
      actionsRef.current = loadResult.actions

      onStepChange('ready')
    } catch (error) {
      setError(
        error instanceof Error && error.message === 'invalid-customer-details'
          ? 'Vérifie tes coordonnées.'
          : "Le paiement n'est pas disponible pour le moment. Réessaie dans un instant.",
      )
      onStepChange('idle')
    }
  }

  async function confirmPayment() {
    if (!actionsRef.current) return
    setError(null)
    onStepChange('confirming')
    const result = await actionsRef.current.confirm({ redirect: 'if_required' })
    if (result.type === 'error') {
      setError(result.error.message || 'Le paiement a échoué. Réessaie avec une autre carte.')
      onStepChange('ready')
      return
    }
    clear()
    router.push(`/commande/succes?session_id=${encodeURIComponent(result.session.id)}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <section>
          <div className="flex items-baseline gap-4">
            <span className="eyebrow text-accent">01</span>
            <h2 className="display min-w-0 wrap-anywhere text-2xl">Livraison</h2>
          </div>

          {step === 'idle' ? (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Prénom</FormLabel>
                      <FormControl>
                        <Input autoComplete="given-name" required className={fieldClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Nom</FormLabel>
                      <FormControl>
                        <Input autoComplete="family-name" required className={fieldClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" required className={fieldClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Téléphone (optionnel)</FormLabel>
                    <FormControl>
                      <Input type="tel" autoComplete="tel" className={fieldClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Adresse</FormLabel>
                    <FormControl>
                      <Input autoComplete="address-line1" required className={fieldClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="line2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Complément d&apos;adresse (optionnel)</FormLabel>
                    <FormControl>
                      <Input autoComplete="address-line2" className={fieldClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Code postal</FormLabel>
                      <FormControl>
                        <Input autoComplete="postal-code" required className={fieldClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Ville</FormLabel>
                      <FormControl>
                        <Input autoComplete="address-level2" required className={fieldClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Pays</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(code) => {
                        field.onChange(code)
                        if (!STATE_REQUIRED_COUNTRIES.has(code)) form.setValue('state', '')
                      }}
                      name={field.name}
                      autoComplete="country"
                      required
                    >
                      <FormControl>
                        <SelectTrigger className={fieldClass}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((option) => (
                          <SelectItem key={option.code} value={option.code} disabled={option.disabled}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {needsState && (
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>État / Province</FormLabel>
                      <FormControl>
                        <Input autoComplete="address-level1" required className={fieldClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <button type="submit" className="eyebrow w-full bg-accent px-8 py-4 text-ink transition-transform hover:-translate-y-0.5">
                Continuer vers le paiement
              </button>
            </div>
          ) : (
            <div className="mt-6 flex items-start justify-between gap-6 border border-ink/10 bg-neutral-100/60 p-5">
              <div className="space-y-1 text-sm leading-relaxed text-neutral-700">
                <p className="text-ink">{summary.firstName} {summary.lastName}</p>
                <p>{summary.line1}</p>
                {summary.line2 && <p>{summary.line2}</p>}
                <p>{summary.postalCode} {summary.city}</p>
                <p>{countryLabel(summary.country)}{summary.state ? ` · ${summary.state}` : ''}</p>
                <p>{summary.email}</p>
                {summary.phone && <p>{summary.phone}</p>}
              </div>
              <button type="button" onClick={handleEdit} className="eyebrow shrink-0 border-b-2 border-accent pb-1 text-ink">
                Modifier
              </button>
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="flex items-baseline gap-4">
            <span className="eyebrow text-accent">02</span>
            <h2 className="display min-w-0 wrap-anywhere text-2xl">Paiement</h2>
          </div>

          {step === 'idle' ? (
            <p className="mt-6 text-sm text-neutral-500">Complète tes coordonnées de livraison pour continuer.</p>
          ) : (
            <div className="mt-6">
              {step === 'creating' && <p className="text-sm text-neutral-500">Préparation du paiement…</p>}
              <div id="payment-element" className="min-h-[16rem]" />
              {step !== 'creating' && (
                <>
                  {totals && (
                    <div className="mt-6 space-y-2 border-t border-ink/10 pt-4 text-sm">
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Livraison</span>
                        <span>{formatPrice(totals.shipping, locale)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="eyebrow">Total</span>
                        <span className="eyebrow text-base">{formatPrice(totals.total, locale)}</span>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={confirmPayment}
                    disabled={step === 'confirming' || !canConfirm}
                    className="eyebrow mt-6 w-full bg-accent px-8 py-4 text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {step === 'confirming' ? 'Paiement en cours…' : 'Payer'}
                  </button>
                  <p className="mt-4 text-xs leading-relaxed text-neutral-500">
                    Paiement sécurisé par Stripe · Prix TTC ·{' '}
                    <Link href="/livraison-et-paiement" className="underline underline-offset-2 hover:text-ink">
                      Livraison et retours
                    </Link>
                  </p>
                </>
              )}
            </div>
          )}
        </section>

        {error && (
          <Alert variant="destructive" className="mt-8 rounded-none">
            <AlertTriangleIcon />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </Form>
  )
}
