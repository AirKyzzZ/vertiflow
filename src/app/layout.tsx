import type { Metadata } from 'next'
import { Archivo, Inter } from 'next/font/google'
import { HtmlLangSync } from '@/components/html-lang-sync'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CartProvider } from '@/components/cart-provider'
import { CartDrawer } from '@/components/cart-drawer'
import { CartDrawerProvider } from '@/components/cart-drawer-provider'
import { Toaster } from '@/components/ui/sonner'
import { getProducts } from '@/lib/catalogue'
import type { ProductSummary } from '@/lib/cart-pricing'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { organizationJsonLd } from '@/lib/structured-data'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://vertiflow.fr'),
  title: {
    default: 'VertiFlow — la porte d’entrée vers le parkour',
    template: '%s · VertiFlow',
  },
  description:
    'Des vêtements de parkour faits pour bouger, et tout ce qu’il faut pour commencer. Bassin d’Arcachon.',
}

export function RootLayout({ children }: { children: React.ReactNode }) {
  const summaries: ProductSummary[] = getProducts().map((product) => ({
    slug: product.slug,
    name: product.name,
    price: product.price,
  }))

  return (
    <html lang={DEFAULT_LOCALE} className={`${archivo.variable} ${inter.variable}`}>
      <body className="bg-paper font-body text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <HtmlLangSync />
        <CartProvider>
          <CartDrawerProvider>
            <SiteHeader />
            {children}
            <SiteFooter />
            <CartDrawer products={summaries} />
          </CartDrawerProvider>
        </CartProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}

export default RootLayout
