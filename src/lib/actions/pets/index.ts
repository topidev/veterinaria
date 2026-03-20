// src/lib/actions/pets/index.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { addPetSchema, type AddPetFormData } from '@/lib/validations/pets'

type ActionResult = { error: string } | { success: true }

export async function addPet(data: AddPetFormData): Promise<ActionResult> {
  const parsed = addPetSchema.safeParse(data)

  if (!parsed.success) {
    return { error: 'Datos inválidos. Verifica el formulario.' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { error } = await supabase.from('pets').insert({
    owner_id: user.id,
    name: parsed.data.name,
    species: parsed.data.species as any,
    breed: parsed.data.breed || null,
    date_of_birth: parsed.data.date_of_birth || null,
    weight_kg: parsed.data.weight_kg ?? null,
    sex: parsed.data.sex as any ?? null,
    is_neutered: parsed.data.is_neutered,
    medical_notes: parsed.data.medical_notes || null,
  })

  if (error) {
    return { error: 'Error al guardar la mascota. Intenta de nuevo.' }
  }

  // revalidatePath refresca el Server Component sin recargar el browser
  revalidatePath('/dashboard/cliente/mascotas')
  revalidatePath('/dashboard/cliente')

  return { success: true }
}