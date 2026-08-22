import { ImageResponse } from 'next/og'
import { getDictionary } from '@/lib/i18n'
import { loadImageDataUri } from '@/lib/og/assets'
import { loadBrandFonts } from '@/lib/og/fonts'
import { ogColor, OG_SIZE } from '@/lib/og/theme'

export const alt = 'VertiFlow — la porte d’entrée vers le parkour'
export const size = OG_SIZE
export const contentType = 'image/png'

const dict = getDictionary('fr')

export default async function Image() {
  const [fonts, plate] = await Promise.all([
    loadBrandFonts(),
    loadImageDataUri('/images/site/home-door.webp', {
      width: OG_SIZE.width,
      height: OG_SIZE.height,
      position: 'bottom',
    }),
  ])

  const { hero } = dict.home
  const headingBefore = hero.headingBefore.toUpperCase()
  const headingAfter = hero.headingAfter.toUpperCase()
  const headingEmphasis = hero.headingEmphasis.toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: ogColor.ink,
          fontFamily: 'Archivo',
        }}
      >
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 6% 112%, rgba(232,145,45,0.5) 0%, rgba(232,145,45,0.18) 30%, rgba(11,11,12,0) 60%)',
          }}
        />

        {plate ? (
          <img
            src={plate}
            width={OG_SIZE.width}
            height={OG_SIZE.height}
            style={{ position: 'absolute', top: 0, left: 0, opacity: 0.82 }}
          />
        ) : null}

        <div
          style={{
            position: 'absolute',
            display: 'flex',
            inset: 0,
            backgroundImage:
              'linear-gradient(to bottom, rgba(11,11,12,0.97) 0%, rgba(11,11,12,0.86) 44%, rgba(11,11,12,0.1) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            padding: '64px 72px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: '-0.01em' }}>
              <span style={{ color: ogColor.paper }}>VERTI</span>
              <span style={{ color: ogColor.accent }}>FLOW</span>
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '0.18em',
                color: ogColor.neutral300,
              }}
            >
              {hero.eyebrow.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 64 }}>
            <div style={{ display: 'flex', width: 110, height: 4, backgroundColor: ogColor.accent, marginBottom: 28 }} />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: 80,
                fontWeight: 700,
                lineHeight: 0.96,
                letterSpacing: '-0.02em',
                color: ogColor.paper,
              }}
            >
              <span style={{ display: 'flex' }}>{headingBefore}</span>
              <span style={{ display: 'flex' }}>
                {headingAfter}&nbsp;<span style={{ color: ogColor.accent }}>{headingEmphasis}</span>.
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  )
}
