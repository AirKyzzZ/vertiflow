'use client'

import { useRef, type ReactNode, type Ref } from 'react'
import { gsap, useGSAP, MOTION_OK } from './gsap'

type LineRevealTag = 'p' | 'h1' | 'h2' | 'h3' | 'dt' | 'dd' | 'span'

type LineRevealProps = {
  children: ReactNode
  as?: LineRevealTag
  className?: string
  delay?: number
}

export function LineReveal({ children, as: Tag = 'p', className = '', delay = 0 }: LineRevealProps) {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          scope.current,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
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
    <Tag ref={scope as Ref<HTMLParagraphElement>} className={className}>
      {children}
    </Tag>
  )
}
