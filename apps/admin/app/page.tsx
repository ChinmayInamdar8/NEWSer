"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGetPostsQuery } from "@/lib/services/api/posts"
import { useGetMeQuery, useLogoutMutation } from "@/lib/services/api/auth"
import { Button } from "@workspace/ui/components/button"

export default function Page() {
  const router = useRouter()
  const { data: user, isLoading: sessionLoading } = useGetMeQuery()
  const isAdmin = user?.role === "ADMIN"
  const [logout] = useLogoutMutation()
  const { data, isLoading } = useGetPostsQuery(undefined, { skip: !isAdmin })

  useEffect(() => {
    if (sessionLoading) return
    if (!isAdmin) {
      router.replace("/login")
    }
  }, [isAdmin, router, sessionLoading])

  if (sessionLoading || !isAdmin) {
    return (
      <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
        Checking session…
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        The data is laoding ...
      </div>
    )
  }

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Admin ready!</h1>
          <p>You may now add components and start building.</p>
          <p>Shared UI is wired through @workspace/ui.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span>Signed in as {user.name ?? user.email}</span>
            <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void logout().then(() => router.replace("/login"))
                }}
              >
              Log out
            </Button>
          </div>
        </div>
        <div className="text-muted-foreground font-mono text-xs">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
        <h1>This Are your Posts</h1>
        <div className="w-screen grid grid-cols-3">
          {data?.map((value: any, index: number) => (
            <div
              key={index}
              className="border border-slate-200 py-6 px-5"
            >
              <h2 className="text-2xl my-3">{value.title}</h2>
              <p>{value.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
