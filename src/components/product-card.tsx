import Image from 'next/image'
import Link from 'next/link'
import { colours, formatPrice, type Product } from '@/lib/catalogue'
import { mediaFor } from '@/lib/product-media'
import { swatchClass } from '@/lib/swatch'

type ProductCardProps = {
  product: Product
  ratio?: string
  index?: number
}

export function ProductCard({ product, ratio, index }: ProductCardProps) {
  const palette = colours(product)
  const [front, alt] = mediaFor(product.slug, palette[0])

  return (
    <Link href={`/boutique/${product.slug}`} className="group block">
      <div className={`grain relative aspect-[4/5] overflow-hidden bg-neutral-100 ${ratio ?? ''}`}>
        <Image
          src={front}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="object-contain p-6 transition-opacity duration-500 group-hover:opacity-0"
        />
        {alt && (
          <Image
            src={alt}
            alt=""
            fill
            aria-hidden
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="scale-[1.02] object-contain p-6 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
          />
        )}
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {typeof index === 'number' && (
            <span className="eyebrow text-neutral-300">{String(index + 1).padStart(2, '0')}</span>
          )}
          <h3 className="display mt-2 wrap-anywhere text-lg lg:text-2xl">{product.name}</h3>
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {palette.map((colour) => (
              <span key={colour} className={`size-2.5 ${swatchClass(colour)}`} />
            ))}
          </div>
        </div>
        <span className="eyebrow whitespace-nowrap pt-1 text-neutral-500">
          {formatPrice(product.price)}
        </span>
      </div>
      <span className="mt-4 block h-px w-0 bg-accent transition-all duration-500 group-hover:w-10" />
    </Link>
  )
}
