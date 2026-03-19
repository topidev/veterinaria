// src/app/(auth)/login/page.tsx
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Accede a tu cuenta VetPoint',
}

// Los query params llegan como props en cualquier page.tsx de Next.js.
// Next.js los tipea como Promise<> en v15 — hay que hacer await.
interface LoginPageProps {
  searchParams: Promise<{
    message?: string
    error?: string
    redirectTo?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <div className="space-y-4">

      {/* Mensaje: "revisa tu correo" después del registro */}
      {params.message === 'check_email' && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-sm text-blue-800 font-medium">Revisa tu correo</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Te enviamos un link de confirmación. Úsalo para activar tu cuenta.
          </p>
        </div>
      )}

      {/* Error: cuenta inactiva (la desactivó el admin) */}
      {params.error === 'account_inactive' && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive font-medium">Cuenta inactiva</p>
          <p className="text-xs text-destructive/80 mt-0.5">
            Tu cuenta ha sido desactivada. Contacta al administrador.
          </p>
        </div>
      )}

      {/* Error: algo falló en el callback de OAuth */}
      {params.error === 'auth_callback_failed' && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive font-medium">Error de autenticación</p>
          <p className="text-xs text-destructive/80 mt-0.5">
            Hubo un problema al iniciar sesión con Google. Intenta de nuevo.
          </p>
        </div>
      )}

      <LoginForm />

    </div>
  )
}