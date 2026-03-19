// src/app/(auth)/register/page.tsx
import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Crea tu cuenta de cliente en VetPoint',
}

export default function RegisterPage() {
  // Esta page no necesita searchParams — el registro no produce
  // mensajes de redirect que haya que mostrar aquí.
  // Si el registro falla, el error vive dentro del RegisterForm.
  // Si el registro funciona, redirige a /login?message=check_email.
  return <RegisterForm />
}