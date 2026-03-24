// src/app/(dashboard)/dashboard/veterinario/perfil/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VetProfileForm } from '@/components/veterinario/VetProfileForm'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi perfil' }

export default async function VetPerfilPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Leer datos de las dos tablas en paralelo
  const [{ data: profile }, { data: vetProfile }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single(),
    supabase
      .from('veterinario_profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
  ])

  // Combinar datos de las dos tablas como defaultValues del form
  const defaultValues = {
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    bio: vetProfile?.bio ?? '',
    license_number: vetProfile?.license_number ?? '',
    specialty: vetProfile?.specialty ?? [],
    consultation_fee: vetProfile?.consultation_fee ?? undefined,
    years_experience: vetProfile?.years_experience ?? undefined,
  }

  return (
    <div className="space-y-6 m-auto max-w-3xl w-full">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mi perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Esta información es visible para los clientes
          </p>
        </div>

        {/* Badge de verificación */}
        {vetProfile?.is_verified ? (
          <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Perfil verificado
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            Pendiente de verificación
          </Badge>
        )}
      </div>

      <VetProfileForm defaultValues={defaultValues} />

    </div>
  )
}