// src/app/(dashboard)/layout.tsx
//
// Server Component — lee la sesión directamente en el servidor.
// Segunda línea de defensa después del middleware.
// Si el middleware falla (edge case), este layout detiene el acceso.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/dashboard/AppSidebar'
import { Separator } from '@/components/ui/separator'
import type { UserRole } from '@/types/supabase'
import { TooltipProvider } from '@/components/ui/tooltip'

// Mapa de rol → ruta de su dashboard.
// Lo usamos para redirigir al usuario a su sección correcta
// cuando llega a /dashboard sin sub-ruta.
// const ROLE_HOME: Record<UserRole, string> = {
//   admin: '/dashboard/admin',
//   veterinario: '/dashboard/veterinario',
//   cliente: '/dashboard/cliente',
// }

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('🔵 Dashboard layout ejecutándose')
  const supabase = await createClient()
  console.log('🔵 Supabase client creado')
  // getUser() verifica el JWT con Supabase en cada request.
  // Más seguro que getSession() que solo lee la cookie local sin verificar.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  console.log('🔵 getUser resultado:', { userId: user?.id, error: error?.message })

  // Sin usuario o con error → al login.
  // Esto no debería ocurrir si el middleware funciona,
  // pero es el safety net si algo falla antes de llegar aquí.
  if (error || !user) {
    console.log('🔴 Sin usuario, redirigiendo a login')
    redirect('/login')
  }

  // Leer el rol desde profiles — más confiable que user_metadata
  // porque lo controla tu DB, no el token de OAuth.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url, is_active')
    .eq('id', user.id)
    .single()

  console.log('🔵 Profile resultado:', { profile, profileError: profileError?.message })

  // Si el profile no existe o la cuenta está desactivada → logout forzado.
  if (!profile || !profile.is_active) {
    console.log('🔴 Sin profile, redirigiendo')
    redirect('/login?error=account_inactive')
  }

  console.log('🟢 Todo OK, renderizando dashboard')

  return (
    // SidebarProvider controla el estado open/closed.
    // Va aqui y no en el root layout porque solo el dashboard lo necesita.
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          role={profile.role as UserRole}
          fullName={profile.full_name}
          email={user.email ?? ''}
          avatarUrl={profile.avatar_url}
        />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return <div>{children}</div>
// }