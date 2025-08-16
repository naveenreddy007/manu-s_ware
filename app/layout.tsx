import type React from "react"
import type { Metadata } from "next"
import { Montserrat, Open_Sans } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/contexts/cart-context"
import { Toaster } from "@/components/ui/toaster"

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["400", "600", "700", "900"],
})

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "MANUS - Premium Menswear & Wardrobe Management",
  description: "Discover premium menswear and manage your wardrobe with intelligent styling recommendations",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable}`}>
      <head>
        <style>{`
html {
  --font-heading: ${montserrat.style.fontFamily};
  --font-body: ${openSans.style.fontFamily};
}
        `}</style>
      </head>
      <body>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  )
}
