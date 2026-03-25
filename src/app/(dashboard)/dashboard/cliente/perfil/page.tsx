// src/app/(dashboard)/dashboard/cliente/perfil/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { ClienteProfileForm } from "@/components/cliente/ClienteProfileForm"
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: 'Mi Perfil' }

export default async function ClientePerfilPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: clienteProfile }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single(),
    supabase
      .from('cliente_profiles')
      .select('address, emergency_contact')
      .eq('id', user.id)
      .single()
  ])

  // Aplanar el jsonb de emergency_contact a campos individuales
  // para que el form pueda manejarlos como inputs separados
  const emergency = clienteProfile?.emergency_contact as {
    name?: string
    phone?: string
    relation?: string
  } | null

  const defaultValues = {
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    address: clienteProfile?.address ?? '',
    emergency_name: emergency?.name ?? '',
    emergency_phone: emergency?.phone ?? '',
    emergency_relation: emergency?.relation ?? '',
  }

  return (
    <div className="space-y-6 w-full m-auto max-w-[1500px]">
      <div>
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tu información personal y de contacto
        </p>
      </div>

      <ClienteProfileForm defaultValues={defaultValues} />
    </div>
  )


}