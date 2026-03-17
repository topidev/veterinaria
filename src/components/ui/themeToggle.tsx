"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <Button variant="outline" size="icon" disabled />

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative flex items-center justify-center overflow-hidden"
    >
      <Sun className="h-5 w-5 theme-toggle-icon sun-icon" />
      <Moon className="absolute h-5 w-5 theme-toggle-icon moon-icon" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}