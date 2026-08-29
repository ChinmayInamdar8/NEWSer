"use client"

import { useLocale, useTranslations } from "next-intl"
import { Languages } from "lucide-react"

import { usePathname, useRouter } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"

import { cn } from "@workspace/ui/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export function LanguageSwitcher() {
  const t = useTranslations("common")

  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="fixed top-5 right-5 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger
            aria-label={t("language")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/85 shadow-sm backdrop-blur-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Languages className="h-5 w-5" />
          </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-36">
          {routing.locales.map((nextLocale) => {
            const active = locale === nextLocale

            const label =
              nextLocale === "mr"
                ? t("marathi")
                : t("english")

            return (
              <DropdownMenuItem
                key={nextLocale}
                onClick={() => {
                  if (!active) {
                    router.replace(pathname, {
                      locale: nextLocale,
                    })
                  }
                }}
                className={cn(
                  "cursor-pointer",
                  active && "bg-accent font-medium"
                )}
              >
                {label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

