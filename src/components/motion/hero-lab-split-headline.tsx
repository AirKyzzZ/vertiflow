'use client'

import { useRef } from 'react'
import { gsap, SplitText, useGSAP, MOTION_OK } from './gsap'

type HeroLabSplitHeadlineProps = {
  before: string
  after: string
  emphasis: string
  className?: string
  emphasisClassName?: string
}

export function HeroLabSplitHeadline({
  before,
  after,
  emphasis,
  className = '',
  emphasisClassName = 'text-accent',
}: HeroLabSplitHeadlineProps) {
  const scope = useRef<HTMLHeadingElement>(null)
  const emphasisRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      let split: SplitText | undefined
      let placeholder: Text | undefined

      mm.add(MOTION_OK, () => {
        const root = scope.current
        const emphasisEl = emphasisRef.current
        if (!root || !emphasisEl) return

        placeholder = document.createTextNode(emphasisEl.textContent || '')
        emphasisEl.replaceWith(placeholder)

        split = SplitText.create(root, {
          type: 'lines, words',
          mask: 'lines',
        })

        split.masks.forEach((mask) => {
          ;(mask as HTMLElement).style.width = 'max-content'
        })

        const emphasisWords = split.words.filter((word) =>
          (word.textContent || '').trim().toLowerCase().startsWith(emphasis.trim().toLowerCase()),
        )
        emphasisWords.forEach((word) => {
          emphasisClassName
            .split(' ')
            .filter(Boolean)
            .forEach((cls) => word.classList.add(cls))
        })

        gsap.set(split.words, { yPercent: 120 })

        gsap.to(split.words, {
          yPercent: 0,
          duration: 0.9,
          delay: 0.1,
          stagger: 0.045,
          ease: 'power4.out',
        })
      })

      return () => {
        mm.revert()
        split?.revert()
        if (placeholder?.parentNode) {
          const span = document.createElement('span')
          span.className = emphasisClassName
          span.textContent = `${emphasis}.`
          placeholder.replaceWith(span)
        }
      }
    },
    { scope },
  )

  return (
    <h1 ref={scope} className={className}>
      <span className="block">{before}</span>
      <span className="block">
        {after}{' '}
        <span ref={emphasisRef} className={emphasisClassName}>
          {emphasis}.
        </span>
      </span>
    </h1>
  )
}
