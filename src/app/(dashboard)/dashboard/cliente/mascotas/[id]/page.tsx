// src/app/(dashboard)/dashboard/cliente/mascotas/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PetAvatarUpload } from '@/components/mascotas/PetAvatarUpload'
import { PetProfileForm } from '@/components/mascotas/PetProfileForm'
import { MedicalHistory } from '@/components/mascotas/MedicalHistory'
import { Scale, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Perfil de mascota' }

interface PetPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientePetPage({ params }: PetPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: pet }, { data: records }] = await Promise.all([
    supabase
      .from('pets')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single(),

    supabase
      .from('medical_records')
      .select('*')
      .eq('pet_id', id)
      .order('date', { ascending: false }),
  ])

  if (!pet) notFound()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/cliente/mascotas"
          className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{pet.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
          </p>
        </div>
      </div>

      {/* Foto */}
      <div className="flex justify-center">
        <PetAvatarUpload
          petId={pet.id}
          ownerId={user.id}
          currentUrl={pet.photo_url}
          petName={pet.name}
        />
      </div>

      {/* Peso actual — solo lectura para el cliente */}
      {pet.weight_kg && (
        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
          <Scale className="h-4 w-4" />
          <span>Peso actual: <span className="font-medium text-foreground">{pet.weight_kg} kg</span></span>
          <span className="text-xs">(actualizado por el veterinario)</span>
        </div>
      )}

      {/* Formulario de datos básicos */}
      <div className="rounded-xl border p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Datos básicos</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Nombre, raza y fecha de nacimiento
          </p>
        </div>
        <PetProfileForm pet={pet} />
      </div>

      {/* Historial clínico — solo lectura */}
      <MedicalHistory
        records={records ?? []}
        petId={pet.id}
        currentWeight={pet.weight_kg}
        canAdd={false}
      />

    </div>
  )
}