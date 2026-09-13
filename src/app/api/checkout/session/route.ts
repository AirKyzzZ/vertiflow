import 'server-only'
import checkoutStatus from '../../../../../functions/get-checkout-session.js'
import { adapt } from '@/lib/netlify-adapter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return adapt(checkoutStatus.handler, request)
}
