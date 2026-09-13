'use client'

import { TextAnimate } from '@/components/ui/text-animate'

type HeroHeadlineProps = {
  before: string
  after: string
  emphasis: string
  className?: string
}

export function HeroHeadline({ before, after, emphasis, className = '' }: HeroHeadlineProps) {
  return (
    <h1 className={className}>
      <span className="motion-reduce:hidden">
        <span className="block" data-hero-line>
          <TextAnimate
            as="span"
            by="word"
            animation="blurInUp"
            duration={0.7}
            delay={0.1}
            startOnView={false}
            once
            className="inline"
          >
            {before}
          </TextAnimate>
        </span>
        <span className="block" data-hero-line>
          <TextAnimate
            as="span"
            by="word"
            animation="blurInUp"
            duration={0.5}
            delay={0.6}
            startOnView={false}
            once
            className="inline"
          >
            {after}
          </TextAnimate>{' '}
          <TextAnimate
            as="span"
            by="word"
            animation="blurInUp"
            duration={0.45}
            delay={1}
            startOnView={false}
            once
            className="inline text-accent"
          >
            {`${emphasis}.`}
          </TextAnimate>
        </span>
      </span>

      <span className="hidden motion-reduce:block">
        <span className="block" data-hero-line>
          {before}
        </span>
        <span className="block" data-hero-line>
          {after} <span className="text-accent">{emphasis}.</span>
        </span>
      </span>
    </h1>
  )
}
