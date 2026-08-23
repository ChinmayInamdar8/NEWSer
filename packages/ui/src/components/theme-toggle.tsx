"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@workspace/ui/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "fixed right-5 bottom-5 z-50 flex size-12 items-center justify-center rounded-full border border-border/70 bg-background/85 text-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md transition duration-200 hover:scale-105 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:shadow-[0_8px_30px_rgb(0,0,0,0.45)]",
        className
      )}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}
