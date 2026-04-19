// src/lib/actions/pets/index.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/client'
import { addPetSchema, MedicalRecordFormData, medicalRecordSchema, PetProfileFormData, petProfileSchema, type AddPetFormData } from '@/lib/validations/pets'
import { success } from 'zod'

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

// ─── Actualizar datos básicos de la mascota ────────────────────
export async function updatePet(
  petId: string,
  data: PetProfileFormData
): Promise<ActionResult> {

  const parsed = petProfileSchema.safeParse(data)
  if(!parsed.success) return { error: 'Datos inválidos.' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No Autenticado' }

  const { data: pet } = await supabase
    .from('pets')
    .select('owner_id')
    .eq('id', petId)
    .single()

  if (pet?.owner_id !== user.id) {
    return { error: 'Sin permisos para editar esta mascota.' }
  }

  const { error } = await supabase
    .from('pets')
    .update({
      name: parsed.data.name,
      breed: parsed.data.breed || null,
      date_of_birth : parsed.data.date_of_birth  || null,
    })
    .eq('id', petId)

  if(error) return { error: 'Error al actualizar la mascota.' }

  revalidatePath(`/dashboard/cliente/mascota/${petId}`)
  revalidatePath('/dashboard/client/mascotas')

  return { success: true }

}

// ─── Actualizar foto de mascota ────────────────────────────────

export async function updatePetAvatar(
  petId: string,
  avatarUrl: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if(!user) return { error: 'No autenticado' }

  const { data: pet } = await supabase
    .from('pets')
    .select('owner_id')
    .eq('id', petId)
    .single()
  
  if(pet?.owner_id !== user.id) {
    return {error:'Sin permiso para editar esta mascota.'}
  }

  const { error } = await supabase
    .from('pets')
    .update({
      photo_url: avatarUrl
    })
    .eq('id', petId)

  if (error) return { error: 'Error al actualizar la foto.' }

  revalidatePath(`/dashboard/cliente/mascotas/${petId}`)
  return { success: true }
}


// ─── Desactivar mascota ────────────────────────────────
export async function deactivatePet(petId: string): Promise<ActionResult> {
  const supabase = createClient()
  const {data:{user}} = await supabase.auth.getUser()
  if(!user) return {error: 'No autenticado.'}

  const { data: pet } = await supabase
    .from('pets')
    .select('owner_id')
    .eq('id', petId)
    .single()

  if (pet?.owner_id !== user.id) {
    return { error: 'Sin permisos.' }  
  }

  const {error} = await supabase
    .from('pets')
    .update({
      is_active: false
    })
    .eq('id', petId)
  
  if(error) return { error: 'Error al eliminar la mascota.' }

  revalidatePath('/dashboard/cliente/mascotas')
  return { success:true }
}

// ─── Agregar registro al historial clínico ──────────────────

export async function createMedicalRecord(
  data: MedicalRecordFormData
): Promise<ActionResult> {
  const parsed = medicalRecordSchema.safeParse(data)
  if (!parsed.success) return { error: 'Datos inválidos.' }

   const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }
 
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if(!['veterinario', 'admin'].includes(profile?.role ?? '')) {
    return { error: 'Solo los veterinarios pueden agregar registros médicos.'}
  }

  const { error } = await supabase
    .from('medical_records')
    .insert({
      pet_id: parsed.data.pet_id,
      vet_id: user.id,
      appointment_id: parsed.data.appointment_id || null,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      date: parsed.data.date,
      next_due_date: parsed.data.next_due_date || null,
    })

  if (error) return { error: 'Error al guardar el registro.' }

  revalidatePath(`/dashboard/veterinario/pacientes/${parsed.data.pet_id}`)
  return { success: true }
}