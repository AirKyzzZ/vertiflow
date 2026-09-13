import 'server-only'
import checkout from '../../../../functions/create-checkout-session.js'
import { adapt } from '@/lib/netlify-adapter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return adapt(checkout.handler, request)
}
