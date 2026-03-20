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


export default async function DashboardLayout({
  children
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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url, is_active')
    .eq('id', user.id)
    .single()


  // Si el profile no existe o la cuenta está desactivada → logout forzado.
  if (!profile || !profile.is_active) {
    redirect('/login?error=account_inactive')
  }

  if (profile.role !== user.user_metadata?.role) {
    const supabase = await createClient()
    console.log("[Dasboard/Layout] --- Revisando el role del usuario...", profile.role)
    await supabase.auth.updateUser({
      data: { role: profile.role }
    })
    redirect(`/dashboard/${profile.role}`)
  }


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
