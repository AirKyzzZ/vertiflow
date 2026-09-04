'use client'

import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP, MOTION_OK } from './gsap'

type ParallaxLayerProps = {
  children: ReactNode
  className?: string
  strength?: number
}

export function ParallaxLayer({ children, className = '', strength = 5 }: ParallaxLayerProps) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          scope.current,
          { yPercent: -strength },
          {
            yPercent: strength,
            ease: 'none',
            scrollTrigger: {
              trigger: scope.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        )
      })

      return () => mm.revert()
    },
    { scope },
  )

  return (
    <div ref={scope} className={`absolute inset-x-0 ${className}`} style={{ top: '-6%', bottom: '-6%' }}>
      {children}
    </div>
  )
}
