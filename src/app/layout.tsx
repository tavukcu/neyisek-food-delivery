import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import RealTimeStatusBar from '@/components/RealTimeStatusBar'
import FloatingHomeButton from '@/components/FloatingHomeButton'
import DeliveryRatingProvider from '@/components/DeliveryRatingProvider'
import ComplaintButton from '@/components/ComplaintButton'

// Google Inter fontunu yüklüyoruz
const inter = Inter({ subsets: ['latin'] })

// Viewport ayarları
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#34d399',
}

// Sayfa meta verileri
export const metadata: Metadata = {
  title: 'NeYisek.com - Lezzetli Yemekler Kapınızda',
  description: 'NeYisek.com ile favori yemeklerinizi online sipariş edin. Hızlı teslimat, kaliteli hizmet.',
  keywords: 'yemek sipariş, online yemek, ev yemeği, fast food, pizza, burger',
  authors: [{ name: 'NeYisek.com' }],
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  robots: 'index, follow',
  openGraph: {
    title: 'NeYisek.com - Lezzetli Yemekler Kapınızda',
    description: 'En sevdiğiniz yemekleri hızlı ve güvenli bir şekilde sipariş edin.',
    type: 'website',
    locale: 'tr_TR',
    url: 'https://neyisek.com',
    siteName: 'NeYisek.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeYisek.com - Lezzetli Yemekler Kapınızda',
    description: 'En sevdiğiniz yemekleri hızlı ve güvenli bir şekilde sipariş edin.',
  }
}

// Ana layout komponenti
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className="scroll-smooth">
      <head>
        {/* Favicon ve diğer meta taglar */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#4caf50" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Ana içerik alanı */}
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
        
        {/* Floating Home Button */}
        <FloatingHomeButton />
        
        {/* Real-time status bar */}
        <RealTimeStatusBar className="fixed bottom-0 left-0 right-0 z-40" />
        
        {/* Delivery Rating Modal Provider */}
        <DeliveryRatingProvider />
        
        {/* Floating Complaint Button */}
        <ComplaintButton variant="floating" size="md" />
        
        {/* Toast bildirimler için container */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
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
          }}
        />
      </body>
    </html>
  )
} 