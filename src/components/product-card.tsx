import Image from 'next/image'
import Link from 'next/link'
import { colours, type Product } from '@/lib/catalogue'
import { isRealPhoto, mediaFor } from '@/lib/product-media'
import { swatchClass } from '@/lib/swatch'
import { formatPrice, productPaths, type Locale } from '@/lib/i18n'

type ProductCardProps = {
  product: Product
  index?: number
  locale?: Locale
}

export function ProductCard({ product, index, locale = 'fr' }: ProductCardProps) {
  const palette = colours(product)
  const [front, alt] = mediaFor(product.slug, palette[0])

  return (
    <Link href={productPaths(product.slug)[locale]} className="group block">
      <div className="grain relative aspect-square overflow-hidden bg-neutral-100">
        <Image
          src={front}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className={`transition-opacity duration-500 group-hover:opacity-0 ${isRealPhoto(front) ? 'object-cover' : 'object-contain'}`}
        />
        {alt && (
          <Image
            src={alt}
            alt=""
            fill
            aria-hidden
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className={`scale-[1.02] opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100 ${isRealPhoto(alt) ? 'object-cover' : 'object-contain'}`}
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
          {formatPrice(product.price, locale)}
        </span>
      </div>
      <span className="mt-4 block h-px w-0 bg-accent transition-all duration-500 group-hover:w-10" />
    </Link>
  )
}
