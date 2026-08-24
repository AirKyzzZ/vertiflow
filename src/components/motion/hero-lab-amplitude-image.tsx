'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { gsap, useGSAP, MOTION_OK } from './gsap'

type HeroLabAmplitudeImageProps = {
  src: string
  className?: string
}

export function HeroLabAmplitudeImage({ src, className = '' }: HeroLabAmplitudeImageProps) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.set(scope.current, { scale: 1.12 })

        gsap
          .timeline()
          .to(scope.current, { scale: 1, duration: 1.4, ease: 'power3.out' })
          .to(scope.current, { scale: 1.05, duration: 9, ease: 'sine.inOut', repeat: -1, yoyo: true })
      })

      return () => mm.revert()
    },
    { scope },
  )

  return (
    <div ref={scope} className={`absolute inset-0 ${className}`}>
      <Image
        src={src}
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover object-right sm:object-center"
      />
    </div>
  )
}
