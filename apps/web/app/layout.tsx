import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google"
import { getLocale } from "next-intl/server"
import type { Metadata } from "next"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
})

export const metadata: Metadata = {
  title: "Daily Corner",
  description: "Discover and discuss news with the community.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        geist.variable,
        notoDevanagari.variable,
        locale === "mr"
          ? "font-[family-name:var(--font-devanagari)]"
          : "font-sans"
      )}
    >
      <body>{children}</body>
    </html>
  )
}
