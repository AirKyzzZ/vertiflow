'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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

  const value: CartContextValue = {
    lines,
    ready,
    count: countLines(lines),
    add: (line) => setLines((current) => addLine(current, line)),
    setQuantity: (index, quantity) => setLines((current) => setLineQuantity(current, index, quantity)),
    remove: (index) => setLines((current) => removeLine(current, index)),
    clear: () => setLines([]),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
