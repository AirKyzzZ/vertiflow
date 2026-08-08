import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VertiFlow',
  description: "La porte d'entrée vers le parkour.",
}

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-paper font-body text-ink">{children}</body>
    </html>
  )
}

export default RootLayout
