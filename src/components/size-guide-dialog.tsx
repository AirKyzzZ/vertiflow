'use client'

import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { SizeTable } from '@/app/guide-des-tailles/size-table'
import { oneSizeProducts, sizedProducts } from '@/app/guide-des-tailles/size-data'
import type { Dictionary } from '@/lib/i18n'

type SizeGuideDialogProps = {
  slug: string
  name: string
  dict: Dictionary['product']
}

export function SizeGuideDialog({ slug, name, dict }: SizeGuideDialogProps) {
  const sized = sizedProducts.find((product) => product.slug === slug)
  const oneSize = oneSizeProducts.find((product) => product.slug === slug)

  if (!sized && !oneSize) {
    return (
      <Link href="/guide-des-tailles" className="eyebrow mt-6 inline-block border-b-2 border-accent pb-1 text-ink">
        {dict.sizeGuideLink}
      </Link>
    )
  }

  return (
    <Dialog>
      <DialogTrigger className="eyebrow mt-6 inline-block border-b-2 border-accent pb-1 text-ink">
        {dict.sizeGuideLink}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>
              {dict.sizeGuideDialogTitle} · {name}
            </span>
            {oneSize && <Badge variant="outline">{dict.oneSize}</Badge>}
          </DialogTitle>
          <DialogDescription>{sized ? sized.fit : oneSize?.fit}</DialogDescription>
        </DialogHeader>

        {sized && (
          <div className="min-w-0 space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-neutral-500">{dict.sizeGuideFabricLabel}</dt>
                <dd className="leading-relaxed">{sized.fabric}</dd>
              </div>
              {sized.note && (
                <div className="border-l-2 border-accent py-1 pl-3 leading-relaxed">{sized.note}</div>
              )}
            </dl>
            <SizeTable sizes={sized.sizes} measurements={sized.measurements} />
          </div>
        )}

        {oneSize && (
          <dl className="space-y-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-neutral-500">{dict.sizeGuideMechanismLabel}</dt>
              <dd className="leading-relaxed">{oneSize.mechanism}</dd>
            </div>
          </dl>
        )}

        <Link href="/guide-des-tailles" className="eyebrow inline-block border-b-2 border-accent pb-1 text-ink">
          {dict.sizeGuideFullLink}
        </Link>
      </DialogContent>
    </Dialog>
  )
}
