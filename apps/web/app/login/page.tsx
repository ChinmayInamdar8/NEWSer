"use client"

import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { useSession } from "@/lib/use-session"

export default function LoginPage() {
  const { user, loading } = useSession()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/50 p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.02_250)_0%,_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.04_250)_0%,_transparent_55%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card/90 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Daily Corner
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Sign in to follow news, join the conversation, and build your feed.
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center text-sm">
            Checking session…
          </p>
        ) : user ? (
          <p className="text-center text-sm">
            You are signed in as{" "}
            <span className="font-medium">{user.name ?? user.email}</span>.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <GoogleSignInButton client="web" apiBaseUrl={apiBaseUrl} />
            <p className="text-muted-foreground text-center text-xs leading-relaxed">
              Reporter accounts are requested separately after you have a
              member login.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
