import 'server-only'

import catalogueModule from '../../functions/lib/catalogue.js'
import provenanceModule from '../../functions/lib/checkout-provenance.js'
import catalogueData from '../../data/products.json'

export const { resolveCart, reviewedUnitAmount, validateCustomer, ValidationError } = catalogueModule
export const { checkoutMetadata, matchesTestAccess, testAccessDigest } = provenanceModule
export const catalogue = catalogueData
