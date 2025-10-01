import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "NEA BARBER - Reserva tu turno",
  description: "Sistema de reservas para NEA BARBER SHOP. Reserva tu turno de 35 minutos desde $35,000 COP",
  generator: "v0.app",
  keywords: ["barbería", "corte de cabello", "reservas", "NEA BARBER", "peluquería"],
  authors: [{ name: "NEA BARBER SHOP" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#00ff88",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <Suspense
          fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-lg font-semibold text-foreground">Cargando NEA BARBER...</div>
              </div>
            </div>
          }
        >
          {children}
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
