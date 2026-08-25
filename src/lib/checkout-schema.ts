import { z } from 'zod'

export type CountryOption = { code: string; label: string; disabled?: boolean }

export const COUNTRIES: CountryOption[] = [
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

export const DEFAULT_COUNTRY = 'FR'

export const STATE_REQUIRED_COUNTRIES = new Set(['US', 'CA', 'AU'])

const KNOWN_COUNTRY_CODES = new Set(COUNTRIES.map((country) => country.code))

function validateCountryRules(country: string, ctx: z.RefinementCtx): boolean {
  if (country === 'UK') {
    ctx.addIssue({ code: 'custom', message: 'Utilise GB plutôt que UK pour le Royaume-Uni.', path: ['country'] })
    return false
  }
  if (!KNOWN_COUNTRY_CODES.has(country)) {
    ctx.addIssue({ code: 'custom', message: 'Ce pays n’est pas reconnu.', path: ['country'] })
    return false
  }
  if (country === 'BR') {
    ctx.addIssue({
      code: 'custom',
      message: 'La livraison au Brésil n’est pas disponible pour le moment (numéro fiscal requis).',
      path: ['country'],
    })
    return false
  }
  return true
}

export const checkoutSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Renseigne ton prénom.').max(100, 'Ce prénom est trop long.'),
    lastName: z.string().trim().min(1, 'Renseigne ton nom.').max(100, 'Ce nom est trop long.'),
    email: z
      .string()
      .trim()
      .min(1, 'Renseigne ton email.')
      .max(320, 'Cet email est trop long.')
      .toLowerCase()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Cet email n’a pas l’air valide.'),
    phone: z.string().trim().max(50, 'Ce numéro est trop long.'),
    line1: z.string().trim().min(1, 'Renseigne ton adresse.').max(200, 'Cette adresse est trop longue.'),
    line2: z.string().trim().max(200, 'Ce complément d’adresse est trop long.'),
    city: z.string().trim().min(1, 'Renseigne ta ville.').max(200, 'Ce nom de ville est trop long.'),
    postalCode: z.string().trim().min(1, 'Renseigne ton code postal.').max(50, 'Ce code postal est trop long.'),
    country: z.string().trim().min(1, 'Choisis un pays.').max(2, 'Code pays invalide.').toUpperCase(),
    state: z.string().trim().max(100, 'Ce champ est trop long.'),
  })
  .superRefine((data, ctx) => {
    const countryValid = validateCountryRules(data.country, ctx)
    if (countryValid && STATE_REQUIRED_COUNTRIES.has(data.country) && !data.state) {
      ctx.addIssue({ code: 'custom', message: 'Renseigne l’état ou la province.', path: ['state'] })
    }
  })

export type CheckoutFormValues = z.infer<typeof checkoutSchema>

export const EMPTY_CHECKOUT_VALUES: CheckoutFormValues = {
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
}
