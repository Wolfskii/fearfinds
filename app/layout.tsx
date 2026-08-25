import type { Metadata, Viewport } from 'next'
import { Cinzel, Cinzel_Decorative, Spectral } from 'next/font/google'
import './globals.scss'
import { Providers } from './providers'
import Header from '@/components/Header'
import MobileNav from '@/components/MobileNav'
import Atmosphere from '@/components/Atmosphere'

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-display', weight: ['400', '700'] })
const logo = Cinzel_Decorative({ subsets: ['latin'], variable: '--font-logo', weight: ['700'] })
const spectral = Spectral({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Fearfinds — haunted places on the map',
  description:
    'A dark map of haunted, cursed, and uncanny places. Drop a pin, add photos, rate the scare — starting with Sweden’s most whispered sites.',
  keywords: ['haunted', 'ghost map', 'Sweden', 'spökhus', 'creepy places', 'Fearfinds'],
}

export const viewport: Viewport = {
  themeColor: '#070605',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${logo.variable} ${spectral.variable}`}>
      <body className="font-body bg-fear-bg text-fear-bone antialiased">
        <Providers>
          <div className="ff-app">
            <Atmosphere />
            <Header />
            <main className="relative z-10">{children}</main>
            <MobileNav />
          </div>
        </Providers>
      </body>
    </html>
  )
}
