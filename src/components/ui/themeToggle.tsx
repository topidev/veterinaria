"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

  // Evita errores de hidratación renderizando el botón solo después de montar
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <Button variant="outline" size="icon" disabled />
    
  const isDark = theme === "dark"

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center overflow-hidden"
    >
      <Sun className="h-5 w-5 transition-transform duration-500 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 transition-transform duration-500 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}