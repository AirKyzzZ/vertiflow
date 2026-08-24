'use client'

import { useRef } from 'react'
import { gsap, useGSAP, MOTION_OK } from './gsap'

type HeroLabStaggerHeadlineProps = {
  before: string
  after: string
  emphasis: string
  className?: string
  emphasisClassName?: string
  initialY?: number
  initialStretch?: string
  finalStretch?: string
  duration?: number
  stagger?: number
  delay?: number
  ease?: string
}

export function HeroLabStaggerHeadline({
  before,
  after,
  emphasis,
  className = '',
  emphasisClassName = 'text-accent',
  initialY = 28,
  initialStretch = '75%',
  finalStretch = '125%',
  duration = 0.9,
  stagger = 0.15,
  delay = 0,
  ease = 'power3.out',
}: HeroLabStaggerHeadlineProps) {
  const scope = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const lines = gsap.utils.toArray<HTMLElement>('[data-hero-line]', scope.current)

        gsap.set(lines, { y: initialY, opacity: 0, fontStretch: initialStretch })

        gsap.to(lines, {
          y: 0,
          opacity: 1,
          fontStretch: finalStretch,
          duration,
          delay,
          stagger,
          ease,
        })
      })

      return () => mm.revert()
    },
    { scope },
  )

  return (
    <h1 ref={scope} className={className}>
      <span className="block" data-hero-line>
        {before}
      </span>
      <span className="block" data-hero-line>
        {after} <span className={emphasisClassName}>{emphasis}</span>.
      </span>
    </h1>
  )
}
