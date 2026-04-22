// src/lib/actions/pets/index.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  addPetSchema,
  petProfileSchema,
  medicalRecordSchema,
  type AddPetFormData,
  type PetProfileFormData,
  type MedicalRecordFormData,
} from '@/lib/validations/pets'

type ActionResult = { error: string } | { success: true }

// ─── Action existente — agregar mascota ───────────────────────────────────────

export async function addPet(data: AddPetFormData): Promise<ActionResult> {
  const parsed = addPetSchema.safeParse(data)
  if (!parsed.success) return { error: 'Datos inválidos. Verifica el formulario.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { error } = await supabase.from('pets').insert({
    owner_id:      user.id,
    name:          parsed.data.name,
    species:       parsed.data.species as any,
    breed:         parsed.data.breed || null,
    date_of_birth: parsed.data.date_of_birth || null,
    weight_kg:     parsed.data.weight_kg ?? null,
    sex:           parsed.data.sex as any ?? null,
    is_neutered:   parsed.data.is_neutered,
    medical_notes: parsed.data.medical_notes || null,
  })

  if (error) return { error: 'Error al guardar la mascota. Intenta de nuevo.' }

  revalidatePath('/dashboard/cliente/mascotas')
  revalidatePath('/dashboard/cliente')
  return { success: true }
}

// ─── Action nueva — actualizar datos básicos de la mascota ────────────────────

export async function updatePet(
  petId: string,
  data: PetProfileFormData
): Promise<ActionResult> {
  const parsed = petProfileSchema.safeParse(data)
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: pet } = await supabase
    .from('pets').select('owner_id').eq('id', petId).single()

  if (pet?.owner_id !== user.id) return { error: 'Sin permisos para editar esta mascota.' }

  const { error } = await supabase
    .from('pets')
    .update({
      name:       parsed.data.name,
      breed:      parsed.data.breed || null,
      date_of_birth: parsed.data.date_of_birth || null,
    })
    .eq('id', petId)

  if (error) return { error: 'Error al actualizar la mascota.' }

  revalidatePath(`/dashboard/cliente/mascotas/${petId}`)
  revalidatePath('/dashboard/cliente/mascotas')
  return { success: true }
}

// ─── Action nueva — actualizar foto de mascota ────────────────────────────────

export async function updatePetAvatar(
  petId: string,
  avatarUrl: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: pet } = await supabase
    .from('pets').select('owner_id').eq('id', petId).single()

  if (pet?.owner_id !== user.id) return { error: 'Sin permisos para editar esta mascota.' }

  const { error } = await supabase
    .from('pets').update({ photo_url: avatarUrl }).eq('id', petId)

  if (error) return { error: 'Error al actualizar la foto.' }

  revalidatePath(`/dashboard/cliente/mascotas/${petId}`)
  return { success: true }
}

// ─── Action nueva — desactivar mascota ───────────────────────────────────────

export async function deactivatePet(petId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: pet } = await supabase
    .from('pets').select('owner_id').eq('id', petId).single()

  if (pet?.owner_id !== user.id) return { error: 'Sin permisos.' }

  const { error } = await supabase
    .from('pets').update({ is_active: false }).eq('id', petId)

  if (error) return { error: 'Error al eliminar la mascota.' }

  revalidatePath('/dashboard/cliente/mascotas')
  return { success: true }
}

// ─── Action nueva — agregar registro al historial clínico ─────────────────────

export async function createMedicalRecord(
  data: MedicalRecordFormData
): Promise<ActionResult> {
  const parsed = medicalRecordSchema.safeParse(data)
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!['veterinario', 'admin'].includes(profile?.role ?? '')) {
    return { error: 'Solo los veterinarios pueden agregar registros médicos.' }
  }

  // Insertar el registro médico con el peso del día
  const { error: recordError } = await supabase
    .from('medical_records')
    .insert({
      pet_id:         parsed.data.pet_id,
      vet_id:         user.id,
      appointment_id: parsed.data.appointment_id || null,
      type:           parsed.data.type,
      title:          parsed.data.title,
      description:    parsed.data.description || null,
      date:           parsed.data.date,
      next_due_date:  parsed.data.next_due_date || null,
      weight_kg:      parsed.data.weight_kg ?? null,
    })

  if (recordError) return { error: 'Error al guardar el registro.' }

  // Si se registró el peso, actualizar también el peso actual en pets
  // Así el cliente siempre ve el peso más reciente sin calcular nada
  if (parsed.data.weight_kg) {
    await supabase
      .from('pets')
      .update({ weight_kg: parsed.data.weight_kg })
      .eq('id', parsed.data.pet_id)
  }

  revalidatePath(`/dashboard/veterinario/pacientes/${parsed.data.pet_id}`)
  revalidatePath(`/dashboard/cliente/mascotas/${parsed.data.pet_id}`)
  return { success: true }
}