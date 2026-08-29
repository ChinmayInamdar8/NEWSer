"use client"

import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { useSession } from "@/lib/use-session"
import { useEffect } from "react"
import { redirect } from "next/navigation"

export default function Page() {
  const { user, loading } = useSession()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL!!

  async function logout() {
    await fetch(`${apiBaseUrl.replace(/\/$/, "")}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
    window.location.reload()
  }

  useEffect(()=>{
    if(user?.role==='ADMIN'){
      redirect(process.env.NEXT_PUBLIC_ADMIN_URL!!)
    }
  }, [user]);

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/50 p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.02_250)_0%,transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.28_0.04_250)_0%,transparent_55%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card/90 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Daily Corner
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Discover and discuss news with the community.
          </p>
        </div>
        {loading ? (
          <p className="text-muted-foreground text-center text-sm">
            Loading session…
          </p>
        ) : user ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm">
              Signed in as{" "}
              <span className="font-medium">{user.name ?? user.email}</span>
            </p>
            <Button type="button" variant="outline" onClick={() => void logout()}>
              Log out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <GoogleSignInButton client="web" apiBaseUrl={apiBaseUrl} />
            <Link
              href="/login"
              className="text-muted-foreground text-center text-xs underline-offset-4 hover:underline"
            >
              Open sign in page
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
