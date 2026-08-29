"use client"

import { googleAuthUrl, type AuthClient } from "@workspace/auth"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useTranslations } from "next-intl"

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46a5.52 5.52 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.55-5.17 3.55-8.67Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3.01c-1.08.72-2.47 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.55.38-2.27V6.62H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

export function GoogleSignInButton({
  client,
  apiBaseUrl,
}: {
  client: AuthClient
  apiBaseUrl: string
}) {
  const href = googleAuthUrl(apiBaseUrl, client)
  const t = useTranslations("auth")

  return (
    <a
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "h-11 w-fit shrink-0 self-center gap-3 px-5 text-[15px] font-medium shadow-sm"
      )}
      href={href}
    >
      <GoogleMark />
      {t("continueWithGoogle")}
    </a>
  )
}
