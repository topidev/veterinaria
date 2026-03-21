// src/app/(auth)/set-password/page.tsx
import type { Metadata } from 'next'
import { SetPasswordForm } from '@/components/auth/SetPasswordForm'

export const metadata: Metadata = { title: 'Crear contraseña' }

interface SetPasswordPageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function SetPasswordPage({ searchParams }: SetPasswordPageProps) {
  const params = await searchParams
  const isInvite = params.type === 'invite'

  return (
    <SetPasswordForm
      title={isInvite ? 'Activa tu cuenta' : 'Nueva contraseña'}
      description={
        isInvite
          ? 'Crea una contraseña para completar tu registro como veterinario'
          : 'Ingresa tu nueva contraseña'
      }
    />
  )
}