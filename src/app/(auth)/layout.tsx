// src/app/(auth)/layout.tsx
//
// Server Component 
// Solo estructura visual: centra el contenido y aplica fondo neutro.
// No verifica sesión aquí — eso lo hace el middleware.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    // %s se reemplaza por el title de cada page hija.
    // Resultado: "Iniciar sesión | VetPoint"
    template: '%s | VetPoint',
    default: 'VetPoint',
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        {/* Logo / marca arriba del form */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">VetPoint</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plataforma veterinaria
          </p>
        </div>

        {/* Aquí renderizan login/page.tsx, register/page.tsx, etc. */}
        {children}
      </div>
    </div>
  )
}