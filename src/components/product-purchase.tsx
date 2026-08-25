'use client'

import { useState } from 'react'
import { AddToCart } from '@/components/add-to-cart'
import { ProductGallery } from '@/components/product-gallery'
import { VariantPicker } from '@/components/variant-picker'
import { LineReveal } from '@/components/motion/line-reveal'
import { RiseIn } from '@/components/motion/rise-in'
import { SizeGuideDialog } from '@/components/size-guide-dialog'
import { StaggerGrid } from '@/components/motion/stagger-grid'
import { mediaFor } from '@/lib/product-media'
import type { SpecRow } from '@/lib/product-copy'
import type { Dictionary } from '@/lib/i18n'

type ProductPurchaseProps = {
  slug: string
  name: string
  index: number
  total: number
  lead: string
  body: string
  formattedPrice: string
  palette: string[]
  sizes: string[]
  specs: SpecRow[]
  dict: Dictionary['product']
}

export function ProductPurchase({
  slug,
  name,
  index,
  total,
  lead,
  body,
  formattedPrice,
  palette,
  sizes,
  specs,
  dict,
}: ProductPurchaseProps) {
  const [colour, setColour] = useState(palette[0])
  const [size, setSize] = useState(sizes[0])
  const images = mediaFor(slug, colour)

  return (
    <>
      <RiseIn>
        <ProductGallery images={images} name={name} />
      </RiseIn>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <LineReveal as="span" className="eyebrow text-accent">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </LineReveal>
        <LineReveal as="h1" className="display mt-3 text-[clamp(2rem,5vw,3.5rem)]" delay={0.1}>
          {name}
        </LineReveal>
        <LineReveal as="p" className="display mt-6 text-2xl leading-tight" delay={0.2}>
          {lead}
        </LineReveal>
        <LineReveal
          as="p"
          className="rule-marker relative mt-4 max-w-md pl-11 leading-relaxed text-neutral-700"
          delay={0.3}
        >
          {body}
        </LineReveal>

        <p className="mt-8 text-2xl">{formattedPrice}</p>
        <p className="eyebrow mt-2 text-neutral-500">{dict.fulfilmentNote}</p>

        <div className="mt-8">
          <VariantPicker
            palette={palette}
            sizes={sizes}
            colour={colour}
            size={size}
            onColour={setColour}
            onSize={setSize}
            dict={dict}
          />
        </div>

        <AddToCart slug={slug} colour={colour} size={size} dict={dict} />

        <StaggerGrid as="dl" className="mt-12 divide-y divide-ink/10 border-y border-ink/10">
          {specs.map((row) => (
            <div key={row.label} className="flex gap-6 py-4">
              <dt className="eyebrow rule-marker relative w-28 shrink-0 pl-8 pt-1 text-neutral-500">
                {row.label}
              </dt>
              <dd className="text-sm leading-relaxed">{row.value}</dd>
            </div>
          ))}
        </StaggerGrid>

        <SizeGuideDialog slug={slug} name={name} dict={dict} />
      </div>
    </>
  )
}
