'use client'

import { useRef } from 'react'
import { gsap, useGSAP, MOTION_OK } from './gsap'

type HeroHeadlineProps = {
  before: string
  after: string
  emphasis: string
  className?: string
}

export function HeroHeadline({ before, after, emphasis, className = '' }: HeroHeadlineProps) {
  const scope = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const lines = gsap.utils.toArray<HTMLElement>('[data-hero-line]', scope.current)

        gsap.set(lines, { y: 28, opacity: 0, fontStretch: '75%' })

        gsap.to(lines, {
          y: 0,
          opacity: 1,
          fontStretch: '125%',
          duration: 0.9,
          stagger: 0.15,
          ease: 'power3.out',
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
        {after} <span className="text-accent">{emphasis}</span>.
      </span>
    </h1>
  )
}
