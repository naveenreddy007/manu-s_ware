import type React from "react"
import type { Metadata } from "next"
import { Montserrat, Open_Sans } from "next/font/google"
import { MobileLayoutWrapper } from "@/components/navigation/mobile-layout-wrapper"
import "./globals.css"

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MANUS" />
      </head>
      <body>
        <MobileLayoutWrapper>{children}</MobileLayoutWrapper>
      </body>
    </html>
  )
}
