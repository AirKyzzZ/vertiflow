import { ImageResponse } from 'next/og'
import type { Product } from '@/lib/catalogue'
import { formatPrice, type Locale } from '@/lib/i18n'
import { heroFor } from '@/lib/product-media'
import { loadImageDataUri } from '@/lib/og/assets'
import { loadBrandFonts } from '@/lib/og/fonts'
import { ogColor, OG_SIZE } from '@/lib/og/theme'

const IMAGE_PANEL_WIDTH = 520
const TEXT_PANEL_WIDTH = OG_SIZE.width - IMAGE_PANEL_WIDTH

function nameFontSize(name: string): number {
  if (name.length >= 20) return 54
  if (name.length >= 15) return 62
  return 76
}

type ProductOgCardProps = {
  product: Product
  locale: Locale
  eyebrow: string
}

export async function renderProductOgImage({ product, locale, eyebrow }: ProductOgCardProps): Promise<ImageResponse> {
  const [fonts, heroImage] = await Promise.all([
    loadBrandFonts(),
    loadImageDataUri(heroFor(product.slug), { width: 900 }),
  ])

  const price = formatPrice(product.price, locale)
  const name = product.name.toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: ogColor.ink,
          fontFamily: 'Archivo',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: TEXT_PANEL_WIDTH,
            height: '100%',
            padding: '56px 64px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>
            <span style={{ color: ogColor.paper }}>VERTI</span>
            <span style={{ color: ogColor.accent }}>FLOW</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 540 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '0.2em',
                color: ogColor.accent,
                marginBottom: 18,
              }}
            >
              {eyebrow.toUpperCase()}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: nameFontSize(name),
                fontWeight: 700,
                lineHeight: 0.98,
                letterSpacing: '-0.01em',
                color: ogColor.paper,
              }}
            >
              {name}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 44,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: ogColor.accent,
                marginTop: 24,
              }}
            >
              {price}
            </div>
          </div>

          <div style={{ display: 'flex', width: 64, height: 4, backgroundColor: ogColor.accent }} />
        </div>

        <div
          style={{
            display: 'flex',
            width: IMAGE_PANEL_WIDTH,
            height: '100%',
            position: 'relative',
            backgroundColor: ogColor.neutral900,
            borderLeft: `3px solid ${ogColor.accent}`,
          }}
        >
          {heroImage ? (
            <img
              src={heroImage}
              width={IMAGE_PANEL_WIDTH}
              height={OG_SIZE.height}
              style={{ objectFit: 'cover', width: IMAGE_PANEL_WIDTH, height: OG_SIZE.height }}
            />
          ) : null}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  )
}
