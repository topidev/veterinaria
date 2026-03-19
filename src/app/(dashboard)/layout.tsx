// src/app/(dashboard)/layout.tsx
//
// Server Component — lee la sesión directamente en el servidor.
// Segunda línea de defensa después del middleware.
// Si el middleware falla (edge case), este layout detiene el acceso.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/supabase'

// Mapa de rol → ruta de su dashboard.
// Lo usamos para redirigir al usuario a su sección correcta
// cuando llega a /dashboard sin sub-ruta.
const ROLE_HOME: Record<UserRole, string> = {
  admin: '/dashboard/admin',
  veterinario: '/dashboard/veterinario',
  cliente: '/dashboard/cliente',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // getUser() verifica el JWT con Supabase en cada request.
  // Más seguro que getSession() que solo lee la cookie local sin verificar.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Sin usuario o con error → al login.
  // Esto no debería ocurrir si el middleware funciona,
  // pero es el safety net si algo falla antes de llegar aquí.
  if (error || !user) {
    redirect('/login')
  }

  // Leer el rol desde profiles — más confiable que user_metadata
  // porque lo controla tu DB, no el token de OAuth.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url, is_active')
    .eq('id', user.id)
    .single()

  // Si el profile no existe o la cuenta está desactivada → logout forzado.
  if (!profile || !profile.is_active) {
    redirect('/login?error=account_inactive')
  }

  return (
    // Estructura base del dashboard: sidebar + contenido principal.
    // El sidebar se construye en Sprint 2 — por ahora solo el shell.
    <div className="min-h-screen flex">

      {/* Sidebar placeholder — Sprint 2 lo convierte en componente real */}
      <aside className="w-64 border-r bg-background hidden md:flex flex-col">
        <div className="p-4 border-b">
          <span className="font-semibold text-sm">VetPoint</span>
        </div>
        <nav className="flex-1 p-4">
          {/* NavLinks van aquí en Sprint 2 */}
        </nav>
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground truncate">
            {profile.full_name ?? user.email}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {profile.role}
          </p>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

    </div>
  )
}