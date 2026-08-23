"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { useGetMeQuery } from "@/lib/services/api/auth"

function LoginForm() {
  const router = useRouter()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
  const { data: user, isLoading } = useGetMeQuery()
  const searchParams = useSearchParams()
  const forbidden = searchParams.get("error") === "forbidden"

  useEffect(() => {
    if (!isLoading && user?.role === "ADMIN") {
      router.replace("/")
    }
  }, [isLoading, router, user?.role])

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/50 p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.02_250)_0%,_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.04_250)_0%,_transparent_55%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card/90 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <p className="text-muted-foreground mb-1 text-xs font-medium tracking-[0.2em] uppercase">
            Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Daily Corner
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Sign in with the Daily Corner admin Google account.
          </p>
        </div>

        {forbidden ? (
          <p className="text-destructive mb-4 text-center text-sm">
            This Google account cannot access the admin dashboard.
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-muted-foreground text-center text-sm">
            Checking session…
          </p>
        ) : user?.role === "ADMIN" ? (
          <p className="text-center text-sm">
            You are signed in as{" "}
            <span className="font-medium">{user.name ?? user.email}</span>.
          </p>
        ) : (
          <div className="flex justify-center">
            <GoogleSignInButton client="admin" apiBaseUrl={apiBaseUrl} />
          </div>
        )}
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
