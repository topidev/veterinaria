// src/app/page.tsx
// Esta página maneja el flujo implícito de Supabase.
// Cuando Supabase redirige con #access_token en el hash,
// el browser llega aquí y este componente procesa el token.
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RootPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
  const handleHashToken = async () => {
    const hash = window.location.hash

    if (hash && hash.includes('access_token')) {
      // En lugar de getSession(), usamos setSession() explícitamente
      // parseando los parámetros del hash manualmente
      const params = new URLSearchParams(hash.replace('#', ''))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const type = params.get('type')

      if (!access_token || !refresh_token) {
        router.replace('/login?error=auth_callback_failed')
        return
      }

      // setSession() crea la sesión con los tokens del hash
      const { data: { session }, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      })

      if (error || !session) {
        router.replace('/login?error=auth_callback_failed')
        return
      }

      if (type === 'invite' || type === 'recovery') {
        router.replace(`/set-password?type=${type}`)
        return
      }

      const role = session.user.user_metadata?.role
      if (role) {
        router.replace(`/dashboard/${role}`)
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        router.replace(`/dashboard/${profile?.role ?? 'cliente'}`)
      }
      return
    }

    // Sin hash — verificar sesión existente
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const role = session.user.user_metadata?.role
      router.replace(role ? `/dashboard/${role}` : '/dashboard')
      return
    }

    router.replace('/login')
  }

  handleHashToken()
}, [])

  // Pantalla de carga mientras procesa
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}