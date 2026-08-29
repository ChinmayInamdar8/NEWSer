"use client"

import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Link } from "@/i18n/navigation"
import { useSession } from "@/lib/use-session"

export default function Page() {
  const t = useTranslations("home")
  const { user, loading } = useSession()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL!!

  async function logout() {
    await fetch(`${apiBaseUrl.replace(/\/$/, "")}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
    window.location.reload()
  }

  useEffect(() => {
    if (user?.role === "ADMIN") {
      window.location.assign(process.env.NEXT_PUBLIC_ADMIN_URL!!)
    }
  }, [user])

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/50 p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.02_250)_0%,transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.28_0.04_250)_0%,transparent_55%)]" />
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
            {t("loadingSession")}
          </p>
        ) : user ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm">
              {t("signedInAs", { name: user.name ?? user.email })}
            </p>
            <Button type="button" variant="outline" onClick={() => void logout()}>
              {t("logOut")}
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
            >
              {t("signIn")}
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
