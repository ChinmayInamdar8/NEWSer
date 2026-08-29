import { hasLocale } from "next-intl"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

import { ThemeProvider } from "@/components/theme-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { routing } from "@/i18n/routing"
import StoreProvider from "../storeProvider"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>
        <StoreProvider>{children}</StoreProvider>
        <LanguageSwitcher />
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
