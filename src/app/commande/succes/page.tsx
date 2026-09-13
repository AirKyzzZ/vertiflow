import type { Metadata } from 'next'
import { SuccesClient } from './succes-client'

export const metadata: Metadata = {
  title: 'Commande confirmée',
  description: 'Ta commande VertiFlow est confirmée. Merci, et à bientôt sur le Bassin.',
  robots: { index: false, follow: false },
}

export function Succes() {
  return <SuccesClient />
}

export default Succes
