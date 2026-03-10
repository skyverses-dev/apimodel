import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: '2brain — AI Credit Platform',
  description: 'Buy AI credits with VietQR bank transfer',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  )
}
