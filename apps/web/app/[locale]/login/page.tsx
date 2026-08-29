"use client"

import { useTranslations } from "next-intl"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { useSession } from "@/lib/use-session"

export default function LoginPage() {
  const t = useTranslations("login")
  const { user, loading } = useSession()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/50 p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.02_250)_0%,_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.04_250)_0%,_transparent_55%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card/90 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            DAILY CORNER
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("tagline")}
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center text-sm">
            {t("checkingSession")}
          </p>
        ) : user ? (
          <p className="text-center text-sm">
            {t("signedInAs", { name: user.name ?? user.email })}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <GoogleSignInButton client="web" apiBaseUrl={apiBaseUrl} />
            <p className="text-muted-foreground text-center text-xs leading-relaxed">
              {t("reporterNote")}
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
