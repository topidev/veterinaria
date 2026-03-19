// src/app/(auth)/forgot-password/page.tsx
import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
  description: 'Recupera el acceso a tu cuenta VetPoint',
}

interface ForgotPasswordPageProps {
  searchParams: Promise<{
    message?: string
  }>
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams

  return (
    <div className="space-y-4">
      {params.message === 'email_sent' && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-sm text-blue-800 font-medium">Correo enviado</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Revisa tu bandeja de entrada y sigue las instrucciones.
          </p>
        </div>
      )}
      <ForgotPasswordForm />
    </div>
  )
}