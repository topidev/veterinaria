// src/app/(dashboard)/dashboard/admin/veterinarios/page.tsx
import { InviteVetButton } from "@/components/admin/InviteVetButton";
import { VetList } from "@/components/admin/VetList";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: 'Veterinarios' }

export default async function AdminVeterinariosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vets } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      phone,
      is_active,
      created_at,
      veterinario_profiles (
        is_verified,
        specialty,
        license_number,
        years_experience,
        consultation_fee,
        bio
      ),
      vet_schedules (
        id,
        day_of_week,
        start_time,
        end_time,
        slot_duration,
        is_active,
        vet_id
      )
    `)
    .eq('role', 'veterinario')
    .order('created_at', { ascending: false })


  return (
    <div className="space-y-6 w-full m-auto max-w-375">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Veterinarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {vets?.length ?? 0} registrados en total
          </p>
        </div>
        <InviteVetButton />
      </div>

      <VetList vets={vets ?? []} />
    </div>
  )
}