'use client'

import { TextAnimate } from '@/components/ui/text-animate'

type HeroLabTextAnimateHeadlineProps = {
  before: string
  after: string
  emphasis: string
  className?: string
  emphasisClassName?: string
}

export function HeroLabTextAnimateHeadline({
  before,
  after,
  emphasis,
  className = '',
  emphasisClassName = 'text-accent',
}: HeroLabTextAnimateHeadlineProps) {
  return (
    <h1 className={className}>
      <span className="motion-reduce:hidden">
        <TextAnimate
          as="span"
          by="word"
          animation="blurInUp"
          duration={0.7}
          delay={0.1}
          startOnView={false}
          once
          className="block"
        >
          {before}
        </TextAnimate>
        <span className="block">
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
            className={`inline ${emphasisClassName}`}
          >
            {`${emphasis}.`}
          </TextAnimate>
        </span>
      </span>

      <span className="hidden motion-reduce:block">
        <span className="block">{before}</span>
        <span className="block">
          {after} <span className={emphasisClassName}>{emphasis}</span>.
        </span>
      </span>
    </h1>
  )
}
