'use client'

import { useRef, type ReactNode } from 'react'
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from './gsap'

type StaggerGridTag = 'div' | 'dl'

type StaggerGridProps = {
  children: ReactNode
  className?: string
  as?: StaggerGridTag
}

export function StaggerGrid({ children, className = '', as: Tag = 'div' }: StaggerGridProps) {
  const scope = useRef<HTMLDivElement & HTMLDListElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const items = scope.current ? Array.from(scope.current.children) : []
        if (items.length === 0) return

        gsap.set(items, { opacity: 0, y: 28 })

        ScrollTrigger.batch(items, {
          start: 'top 88%',
          once: true,
          onEnter: (batchItems) =>
            gsap.to(batchItems, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: 'power3.out',
            }),
        })
      })

      return () => mm.revert()
    },
    { scope },
  )

  return (
    <Tag ref={scope} className={className}>
      {children}
    </Tag>
  )
}
