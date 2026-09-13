'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const AUTO_CLOSE_DELAY_MS = 6000

type CartDrawerContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  openOnAdd: () => void
  cancelAutoClose: () => void
  restoreFocusToTrigger: () => void
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null)

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const cancelAutoClose = useCallback(() => {
    if (timerRef.current === null) return
    clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const captureTrigger = useCallback(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }, [])

  const restoreFocusToTrigger = useCallback(() => {
    const trigger = triggerRef.current
    if (trigger && document.contains(trigger)) trigger.focus()
  }, [])

  const setOpen = useCallback(
    (next: boolean) => {
      cancelAutoClose()
      if (next) captureTrigger()
      setOpenState(next)
    },
    [cancelAutoClose, captureTrigger],
  )

  const openOnAdd = useCallback(() => {
    cancelAutoClose()
    captureTrigger()
    setOpenState(true)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setOpenState(false)
    }, AUTO_CLOSE_DELAY_MS)
  }, [cancelAutoClose, captureTrigger])

  useEffect(() => cancelAutoClose, [cancelAutoClose])

  const value = useMemo<CartDrawerContextValue>(
    () => ({ open, setOpen, openOnAdd, cancelAutoClose, restoreFocusToTrigger }),
    [open, setOpen, openOnAdd, cancelAutoClose, restoreFocusToTrigger],
  )

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>
}

export function useCartDrawer(): CartDrawerContextValue {
  const context = useContext(CartDrawerContext)
  if (!context) throw new Error('useCartDrawer must be used inside CartDrawerProvider')
  return context
}
