// src/app/(dashboard)/dashboard/veterinario/pacientes/[petId]/page.tsx

import { createClient } from "@/lib/supabase/server"
import { ChevronLeft } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { MedicalHistory } from "@/components/mascotas/MedicalHistory"

export const metadata: Metadata = {
    title: 'Historial de Paciente'
}

interface VetPetPageProps {
    params: Promise<{ petId: string }>
}

export default async function VetPetPage({ params }: VetPetPageProps) {
    const { petId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if(!user) redirect('login')

    const [{data: pet}, {data: records}] = await Promise.all([
        supabase
            .from('pets')
            .select(`
                *,
                owner:profiles!pets_owner_id_fkey (full_name, phone)
            `)
            .eq('id', petId)
            .single(),
        supabase
            .from('medical_records')
            .select('*')
            .eq('pet_id', petId)
            .order('date', { ascending: false })
    ])

    if(!pet) notFound()

    const owner = pet.owner as any
    const age = pet.date_of_birth
        ? Math.floor((Date.now() - new Date(pet.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365))
        : null
    return (
    <div className="space-y-6 max-w-2xl mx-auto">
 
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/veterinario/agenda"
          className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Historial del paciente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registros clínicos y datos de la mascota
          </p>
        </div>
      </div>
 
      {/* Card de info de la mascota */}
      <div className="rounded-xl border p-5 flex items-center gap-5">
        <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted shrink-0">
          {pet.photo_url ? (
            <Image
              src={pet.photo_url}
              alt={pet.name}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
          )}
        </div>
 
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{pet.name}</h2>
            <Badge variant="outline" className="text-xs capitalize">{pet.species}</Badge>
          </div>
 
          <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
            {pet.breed && <p>Raza: {pet.breed}</p>}
            {age !== null && <p>Edad: {age} año{age !== 1 ? 's' : ''}</p>}
            {owner?.full_name && (
              <p>Dueño: {owner.full_name}
                {owner?.phone && <span className="ml-2">· {owner.phone}</span>}
              </p>
            )}
          </div>
        </div>
      </div>
 
      {/* Historial clínico — con permisos para agregar */}
      <MedicalHistory
        records={records ?? []}
        petId={petId}
        canAdd={true}
      />
 
    </div>
  )
}