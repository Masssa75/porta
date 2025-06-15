import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PortA - Crypto Monitor',
  description: 'Real-time crypto monitoring with AI alerts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}