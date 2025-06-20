import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import dynamic from 'next/dynamic'

// Dynamic imports for better performance
const RealTimeStatusBar = dynamic(() => import('@/components/RealTimeStatusBar'), {
  ssr: false,
  loading: () => null
})

const FloatingHomeButton = dynamic(() => import('@/components/FloatingHomeButton'), {
  ssr: false,
  loading: () => null
})

const DeliveryRatingProvider = dynamic(() => import('@/components/DeliveryRatingProvider'), {
  ssr: false,
  loading: () => null
})

const ComplaintButton = dynamic(() => import('@/components/ComplaintButton'), {
  ssr: false,
  loading: () => null
})

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
})

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#34d399' },
    { media: '(prefers-color-scheme: dark)', color: '#059669' }
  ],
  colorScheme: 'light dark'
}

// Enhanced metadata for SEO
export const metadata: Metadata = {
  metadataBase: new URL('https://neyisek.com'),
  title: {
    default: 'NeYisek.com - Lezzetli Yemekler Kapınızda',
    template: '%s | NeYisek.com'
  },
  description: 'NeYisek.com ile favori yemeklerinizi online sipariş edin. Türkiye\'nin en hızlı yemek teslimat platformu. Hızlı teslimat, kaliteli hizmet.',
  keywords: [
    'yemek sipariş',
    'online yemek',
    'ev yemeği',
    'fast food',
    'pizza',
    'burger',
    'türk mutfağı',
    'yemek teslimat',
    'restoran',
    'istanbul yemek'
  ],
  authors: [{ name: 'NeYisek.com', url: 'https://neyisek.com' }],
  creator: 'NeYisek.com',
  publisher: 'NeYisek.com',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#34d399' },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://neyisek.com',
    siteName: 'NeYisek.com',
    title: 'NeYisek.com - Lezzetli Yemekler Kapınızda',
    description: 'En sevdiğiniz yemekleri hızlı ve güvenli bir şekilde sipariş edin. Türkiye\'nin en hızlı yemek teslimat platformu.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NeYisek.com - Yemek Sipariş Platformu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@neyisekcom',
    creator: '@neyisekcom',
    title: 'NeYisek.com - Lezzetli Yemekler Kapınızda',
    description: 'En sevdiğiniz yemekleri hızlı ve güvenli bir şekilde sipariş edin.',
    images: ['/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://neyisek.com',
    languages: {
      'tr-TR': 'https://neyisek.com',
      'en-US': 'https://neyisek.com/en',
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

// Optimized root layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${inter.variable} scroll-smooth`}>
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        
        {/* Favicon and app icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#34d399" />
        <meta name="theme-color" content="#34d399" />
        
        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`} suppressHydrationWarning>
        {/* Skip to main content for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50">
          Ana içeriğe geç
        </a>
        
        {/* Main content area */}
        <div className="min-h-screen flex flex-col">
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </div>
        
        {/* Dynamic components loaded after initial render */}
        <FloatingHomeButton />
        <RealTimeStatusBar className="fixed bottom-0 left-0 right-0 z-40" />
        <DeliveryRatingProvider>
          <></>
        </DeliveryRatingProvider>
        <ComplaintButton variant="floating" size="md" />
        
        {/* Optimized toast notifications */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
            loading: {
              duration: Infinity,
            },
          }}
        />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
} 