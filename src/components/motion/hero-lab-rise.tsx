'use client'

import { useRef, type ReactNode, type Ref } from 'react'
import { gsap, useGSAP, MOTION_OK } from './gsap'

type HeroLabRiseTag = 'p' | 'div'

type HeroLabRiseProps = {
  children: ReactNode
  as?: HeroLabRiseTag
  className?: string
  delay?: number
  distance?: number
  duration?: number
}

export function HeroLabRise({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
  distance = 24,
  duration = 0.7,
}: HeroLabRiseProps) {
  const scope = useRef<HTMLDivElement & HTMLParagraphElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          scope.current,
          { y: distance, opacity: 0 },
          { y: 0, opacity: 1, duration, delay, ease: 'power3.out' },
        )
      })

      return () => mm.revert()
    },
    { scope },
  )

  return (
    <Tag ref={scope as Ref<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  )
}
