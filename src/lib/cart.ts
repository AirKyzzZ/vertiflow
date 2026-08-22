export type CartLine = {
  slug: string
  color: string
  size: string
  quantity: number
}

export const CART_STORAGE_KEY = 'cart'

const MIN_QUANTITY = 1
const MAX_QUANTITY = 10
const MAX_LINES = 100

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_QUANTITY
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.floor(quantity)))
}

function toLine(value: unknown): CartLine | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  const slug = typeof record.slug === 'string' ? record.slug : record.id
  const { color, size, quantity } = record
  if (typeof slug !== 'string' || !slug) return null
  if (typeof color !== 'string' || !color) return null
  if (typeof size !== 'string' || !size) return null
  if (!Number.isInteger(quantity) || (quantity as number) < MIN_QUANTITY) return null
  return { slug, color, size, quantity: clampQuantity(quantity as number) }
}

export function readCart(raw: string | null): CartLine[] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.map(toLine).filter((line): line is CartLine => line !== null).slice(0, MAX_LINES)
}

function sameVariant(a: CartLine, b: CartLine): boolean {
  return a.slug === b.slug && a.color === b.color && a.size === b.size
}

export function addLine(lines: CartLine[], line: CartLine): CartLine[] {
  const index = lines.findIndex((existing) => sameVariant(existing, line))
  if (index === -1) return [...lines, { ...line, quantity: clampQuantity(line.quantity) }].slice(0, MAX_LINES)
  return lines.map((existing, position) =>
    position === index
      ? { ...existing, quantity: clampQuantity(existing.quantity + line.quantity) }
      : existing,
  )
}

export function setQuantity(lines: CartLine[], index: number, quantity: number): CartLine[] {
  return lines.map((line, position) =>
    position === index ? { ...line, quantity: clampQuantity(quantity) } : line,
  )
}

export function removeLine(lines: CartLine[], index: number): CartLine[] {
  return lines.filter((_, position) => position !== index)
}

export function countLines(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0)
}
