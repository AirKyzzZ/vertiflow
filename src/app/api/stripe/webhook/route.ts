import 'server-only'
import webhook from '../../../../../functions/stripe-webhook.js'
import { adapt } from '@/lib/netlify-adapter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return adapt(webhook.handler, request)
}
