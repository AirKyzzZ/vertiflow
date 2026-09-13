export type PaymentStatus = 'checking' | 'paid' | 'unpaid'

export type PaymentStatusFetch = (sessionId: string) => Promise<{
  ok: boolean
  json: () => Promise<{ paymentStatus?: string }>
}>

export type CheckPaymentStatusOptions = {
  attempts?: number
  delayMs?: number
  wait?: (ms: number) => Promise<void>
}

const DEFAULT_ATTEMPTS = 4
const DEFAULT_DELAY_MS = 600

function defaultWait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function checkPaymentStatus(
  sessionId: string,
  fetchStatus: PaymentStatusFetch,
  options: CheckPaymentStatusOptions = {},
): Promise<PaymentStatus> {
  const attempts = options.attempts ?? DEFAULT_ATTEMPTS
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS
  const wait = options.wait ?? defaultWait

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchStatus(sessionId)
      if (response.ok) {
        const payload = await response.json()
        return payload.paymentStatus === 'paid' ? 'paid' : 'unpaid'
      }
    } catch {}
    if (attempt < attempts) await wait(delayMs * attempt)
  }
  return 'checking'
}
