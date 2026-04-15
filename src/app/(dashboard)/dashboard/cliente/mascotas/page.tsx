// src/app/(dashboard)/dashboard/cliente/mascotas/page.tsx
import { AddPetButton } from "@/components/mascotas/AddPetButton"
import { PetCard } from "@/components/mascotas/PetCard"
import { createClient } from "@/lib/supabase/server"
import { PawPrint } from "lucide-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: 'Mis Mascotas' }

export default async function MascotasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pets } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const petList = pets ?? []

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mis mascotas</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-2.5 md:mb-auto">
            {petList.length === 0
              ? 'Aún no tienes mascotas registradas'
              : `${petList.length} ${petList.length === 1 ? 'mascota registrada' : 'mascotas registradas'}`
            }
          </p>
        </div>
        {/* AddPetButton abre el modal — Client Component */}
        <AddPetButton />
      </div>

      {petList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PawPrint className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium mb-2">Sin mascotas aún</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Registra a tus compañeros para poder agendar citas y llevar su historial médico
          </p>
          <AddPetButton variant="default" label="Agregar primera mascota" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {petList.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              href={`/dashboard/cliente/mascotas/${pet.id}`}
            />
          ))}
        </div>
      )}

    </div>
  )
}