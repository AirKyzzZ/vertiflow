'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import type { StripeCheckoutLoadActionsSuccess } from '@stripe/stripe-js'
import { useCart } from '@/components/cart-provider'

type CheckoutStep = 'idle' | 'creating' | 'ready' | 'confirming'

type ShippingForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  line1: string
  line2: string
  city: string
  postalCode: string
  country: string
  state: string
}

type Country = { code: string; label: string; disabled?: boolean }

const COUNTRIES: Country[] = [
  { code: 'FR', label: 'France' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'AU', label: 'Australie' },
  { code: 'AT', label: 'Autriche' },
  { code: 'BE', label: 'Belgique' },
  { code: 'BR', label: 'Brésil — indisponible', disabled: true },
  { code: 'BG', label: 'Bulgarie' },
  { code: 'CA', label: 'Canada' },
  { code: 'CY', label: 'Chypre' },
  { code: 'HR', label: 'Croatie' },
  { code: 'DK', label: 'Danemark' },
  { code: 'ES', label: 'Espagne' },
  { code: 'EE', label: 'Estonie' },
  { code: 'US', label: 'États-Unis' },
  { code: 'FI', label: 'Finlande' },
  { code: 'GR', label: 'Grèce' },
  { code: 'HU', label: 'Hongrie' },
  { code: 'IE', label: 'Irlande' },
  { code: 'IS', label: 'Islande' },
  { code: 'IT', label: 'Italie' },
  { code: 'LV', label: 'Lettonie' },
  { code: 'LI', label: 'Liechtenstein' },
  { code: 'LT', label: 'Lituanie' },
  { code: 'LU', label: 'Luxembourg' },
  { code: 'MT', label: 'Malte' },
  { code: 'NO', label: 'Norvège' },
  { code: 'NZ', label: 'Nouvelle-Zélande' },
  { code: 'NL', label: 'Pays-Bas' },
  { code: 'PL', label: 'Pologne' },
  { code: 'PT', label: 'Portugal' },
  { code: 'RO', label: 'Roumanie' },
  { code: 'GB', label: 'Royaume-Uni' },
  { code: 'SK', label: 'Slovaquie' },
  { code: 'SI', label: 'Slovénie' },
  { code: 'SE', label: 'Suède' },
  { code: 'CH', label: 'Suisse' },
  { code: 'CZ', label: 'Tchéquie' },
]

const STATE_REQUIRED_COUNTRIES = new Set(['US', 'CA', 'AU'])

const EMPTY_FORM: ShippingForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  country: 'FR',
  state: '',
}

function countryLabel(code: string): string {
  return COUNTRIES.find((country) => country.code === code)?.label ?? code
}

const fieldClass = 'mt-2 w-full border border-ink/20 bg-paper px-4 py-3 text-sm outline-none focus:border-ink'
const labelClass = 'eyebrow text-neutral-500'

type FieldProps = {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'tel'
  required?: boolean
  autoComplete?: string
  inputMode?: 'numeric'
}

function Field({ label, name, value, onChange, type = 'text', required, autoComplete, inputMode }: FieldProps) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </label>
  )
}

type CheckoutFormProps = {
  promoCode: string
}

export function CheckoutForm({ promoCode }: CheckoutFormProps) {
  const { lines } = useCart()
  const [step, setStep] = useState<CheckoutStep>('idle')
  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [canConfirm, setCanConfirm] = useState(false)
  const actionsRef = useRef<StripeCheckoutLoadActionsSuccess | null>(null)

  const needsState = STATE_REQUIRED_COUNTRIES.has(form.country)

  function updateField(name: keyof ShippingForm) {
    return (value: string) => setForm((current) => ({ ...current, [name]: value }))
  }

  function updateCountry(code: string) {
    setForm((current) => ({ ...current, country: code, state: STATE_REQUIRED_COUNTRIES.has(code) ? current.state : '' }))
  }

  function handleEdit() {
    actionsRef.current = null
    setCanConfirm(false)
    setError(null)
    setStep('idle')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step !== 'idle') return
    setError(null)
    setStep('creating')

    const customer = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      address: {
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        postal_code: form.postalCode,
        country: form.country,
        state: form.state,
      },
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines, customer, promoCode }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error('request-failed')

      const stripe = await loadStripe(payload.publishableKey, { locale: 'fr' })
      if (!stripe) throw new Error('stripe-unavailable')

      const checkout = stripe.initCheckoutElementsSdk({ clientSecret: payload.clientSecret })
      checkout.on('change', (session) => setCanConfirm(session.canConfirm))

      const paymentElement = checkout.createPaymentElement()
      paymentElement.mount('#payment-element')

      const loadResult = await checkout.loadActions()
      if (loadResult.type === 'error') throw new Error('actions-unavailable')
      actionsRef.current = loadResult.actions

      setStep('ready')
    } catch {
      setError("Le paiement n'est pas disponible pour le moment. Réessaie dans un instant.")
      setStep('idle')
    }
  }

  async function confirmPayment() {
    if (!actionsRef.current) return
    setError(null)
    setStep('confirming')
    const result = await actionsRef.current.confirm()
    if (result.type === 'error') {
      setError(result.error.message || 'Le paiement a échoué. Réessaie avec une autre carte.')
      setStep('ready')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <section>
        <div className="flex items-baseline gap-4">
          <span className="eyebrow text-accent">01</span>
          <h2 className="display text-2xl">Livraison</h2>
        </div>

        {step === 'idle' ? (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom" name="firstName" required autoComplete="given-name" value={form.firstName} onChange={updateField('firstName')} />
              <Field label="Nom" name="lastName" required autoComplete="family-name" value={form.lastName} onChange={updateField('lastName')} />
            </div>
            <Field label="Email" name="email" type="email" required autoComplete="email" value={form.email} onChange={updateField('email')} />
            <Field label="Téléphone (optionnel)" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={updateField('phone')} />
            <Field label="Adresse" name="line1" required autoComplete="address-line1" value={form.line1} onChange={updateField('line1')} />
            <Field label="Complément d'adresse (optionnel)" name="line2" autoComplete="address-line2" value={form.line2} onChange={updateField('line2')} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Code postal" name="postalCode" required autoComplete="postal-code" inputMode="numeric" value={form.postalCode} onChange={updateField('postalCode')} />
              <Field label="Ville" name="city" required autoComplete="address-level2" value={form.city} onChange={updateField('city')} />
            </div>
            <label className="block">
              <span className={labelClass}>Pays</span>
              <select
                name="country"
                required
                autoComplete="country"
                value={form.country}
                onChange={(event) => updateCountry(event.target.value)}
                className={fieldClass}
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code} disabled={country.disabled}>
                    {country.label}
                  </option>
                ))}
              </select>
            </label>
            {needsState && (
              <Field label="État / Province" name="state" required autoComplete="address-level1" value={form.state} onChange={updateField('state')} />
            )}

            <button type="submit" className="eyebrow w-full bg-accent px-8 py-4 text-ink transition-transform hover:-translate-y-0.5">
              Continuer vers le paiement
            </button>
          </div>
        ) : (
          <div className="mt-6 flex items-start justify-between gap-6 border border-ink/10 bg-neutral-100/60 p-5">
            <div className="space-y-1 text-sm leading-relaxed text-neutral-700">
              <p className="text-ink">{form.firstName} {form.lastName}</p>
              <p>{form.line1}</p>
              {form.line2 && <p>{form.line2}</p>}
              <p>{form.postalCode} {form.city}</p>
              <p>{countryLabel(form.country)}{form.state ? ` · ${form.state}` : ''}</p>
              <p>{form.email}</p>
              {form.phone && <p>{form.phone}</p>}
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
          <h2 className="display text-2xl">Paiement</h2>
        </div>

        {step === 'idle' ? (
          <p className="mt-6 text-sm text-neutral-500">Complète tes coordonnées de livraison pour continuer.</p>
        ) : (
          <div className="mt-6">
            {step === 'creating' && <p className="text-sm text-neutral-500">Préparation du paiement…</p>}
            <div id="payment-element" className="min-h-[16rem]" />
            {step !== 'creating' && (
              <>
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
        <p role="alert" className="mt-8 border-l-2 border-accent bg-neutral-100 px-4 py-3 text-sm text-ink">
          <span className="eyebrow block text-accent">Erreur</span>
          {error}
        </p>
      )}
    </form>
  )
}
