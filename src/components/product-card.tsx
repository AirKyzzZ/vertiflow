import Image from 'next/image'
import Link from 'next/link'
import { colours, coverImage, formatPrice, type Product } from '@/lib/catalogue'

export function ProductCard({ product }: { product: Product }) {
  const palette = colours(product)

  return (
    <Link href={`/boutique/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <Image
          src={coverImage(product)}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-medium tracking-tight">{product.name}</h3>
        <span className="whitespace-nowrap text-sm text-neutral-700">
          {formatPrice(product.price)}
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">{palette.join(' · ')}</p>
    </Link>
  )
}
