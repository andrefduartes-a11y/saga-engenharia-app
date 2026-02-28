import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme-context'
import PwaInstallBanner from '@/components/PwaInstallBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SAGA Engenharia',
  description: 'Apoio técnico ao engenheiro de obra no canteiro',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/ico-cinza.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/ico-branco.png', sizes: '192x192', type: 'image/png' }],
    shortcut: '/ico-cinza.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SAGA Engenharia',
    startupImage: '/ico-branco.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'application-name': 'SAGA Engenharia',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1C2B1A',
}

// Script anti-flash como string separada (necessário para não escapar caracteres)
const themeScript = `(function(){try{var s=localStorage.getItem('saga-theme');var p=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.setAttribute('data-theme',s||p);}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Script anti-flash: deve rodar antes de qualquer renderização */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <PwaInstallBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
