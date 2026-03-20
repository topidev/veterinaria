// src/app/(dashboard)/dashboard/page.tsx
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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  redirect(ROLE_HOME[profile.role as UserRole])
}