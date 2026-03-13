import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: {
    default: '2brain — AI Credit Platform',
    template: '%s — 2brain',
  },
  description: 'Nạp credit AI qua QR code, nhận tức thì. Hỗ trợ Claude, GPT-4, Gemini và 50+ mô hình AI.',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  )
}
