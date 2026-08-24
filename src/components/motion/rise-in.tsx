'use client'

import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP, MOTION_OK } from './gsap'

type RiseInProps = {
  children: ReactNode
  className?: string
  delay?: number
}

export function RiseIn({ children, className = '', delay = 0 }: RiseInProps) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          scope.current,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: scope.current,
              start: 'top 90%',
              once: true,
            },
          },
        )
      })

      return () => mm.revert()
    },
    { scope },
  )

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  )
}
