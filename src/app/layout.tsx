import type { Metadata } from 'next'
import { Archivo, Inter } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CartProvider } from '@/components/cart-provider'
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
  return (
    <html lang="fr" className={`${archivo.variable} ${inter.variable}`}>
      <body className="bg-paper font-body text-ink antialiased">
        <CartProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  )
}

export default RootLayout
