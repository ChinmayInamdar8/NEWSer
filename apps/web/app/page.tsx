"use client"

import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { useSession } from "@/lib/use-session"
import { useEffect } from "react"
import { redirect } from "next/navigation"
import Header from "@/components/common/header"

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
    <main className="w-screen h-screen">
      <div className="">
        <Header/>
      </div>
    </main>
  )
}
