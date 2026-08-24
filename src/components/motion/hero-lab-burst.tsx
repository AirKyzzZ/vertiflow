'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { gsap, useGSAP, MOTION_OK } from './gsap'

type HeroLabBurstProps = {
  frames: string[]
  className?: string
  stepSeconds?: number
}

export function HeroLabBurst({ frames, className = '', stepSeconds = 0.1 }: HeroLabBurstProps) {
  const scope = useRef<HTMLDivElement>(null)
  const settleIndex = frames.length - 1

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const frameEls = gsap.utils.toArray<HTMLElement>('[data-burst-frame]', scope.current)
        if (frameEls.length === 0) return

        gsap.set(frameEls, { opacity: 0 })

        const tl = gsap.timeline()
        frameEls.forEach((frame, index) => {
          tl.set(frame, { opacity: 1 }, index * stepSeconds)
          if (index < frameEls.length - 1) {
            tl.set(frame, { opacity: 0 }, (index + 1) * stepSeconds)
          }
        })
      })

      return () => mm.revert()
    },
    { scope },
  )

  return (
    <div ref={scope} className={`absolute inset-0 ${className}`}>
      {frames.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          preload
          sizes="100vw"
          data-burst-frame
          className={`object-cover object-right sm:object-center ${
            index === settleIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  )
}
