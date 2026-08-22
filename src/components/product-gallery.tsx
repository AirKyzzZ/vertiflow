import Image from 'next/image'

type ProductGalleryProps = {
  images: string[]
  name: string
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto lg:grid lg:snap-none lg:grid-cols-1 lg:gap-4 lg:overflow-visible">
      {images.map((src, position) => (
        <div
          key={src}
          className="grain relative aspect-square w-[85%] shrink-0 snap-center bg-neutral-100 lg:w-auto lg:shrink"
        >
          <Image
            src={src}
            alt={position === 0 ? name : ''}
            fill
            priority={position === 0}
            sizes="(min-width: 1024px) 45vw, 85vw"
            className="object-contain"
          />
        </div>
      ))}
    </div>
  )
}
