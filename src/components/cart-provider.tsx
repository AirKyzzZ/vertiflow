'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  CART_STORAGE_KEY,
  addLine,
  countLines,
  readCart,
  removeLine,
  setQuantity as setLineQuantity,
  type CartLine,
} from '@/lib/cart'

type CartContextValue = {
  lines: CartLine[]
  ready: boolean
  count: number
  add: (line: CartLine) => void
  setQuantity: (index: number, quantity: number) => void
  remove: (index: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setLines(readCart(window.localStorage.getItem(CART_STORAGE_KEY)))
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
  }, [lines, ready])

  const add = useCallback((line: CartLine) => setLines((current) => addLine(current, line)), [])
  const setQuantity = useCallback(
    (index: number, quantity: number) => setLines((current) => setLineQuantity(current, index, quantity)),
    [],
  )
  const remove = useCallback((index: number) => setLines((current) => removeLine(current, index)), [])
  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartContextValue>(
    () => ({ lines, ready, count: countLines(lines), add, setQuantity, remove, clear }),
    [lines, ready],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
