// src/lib/actions/veterinario/index.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { vetProfileSchema, type VetProfileFormData } from '@/lib/validations/veterinario'

type ActionResult = { error: string } | { success: true }

export async function updateVetProfile(data: VetProfileFormData): Promise<ActionResult> {
  const parsed = vetProfileSchema.safeParse(data)

  if (!parsed.success) {
    return { error: 'Datos inválidos. Verifica el formulario.' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // Actualizar datos base en profiles (nombre y teléfono)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: 'Error al actualizar el perfil.' }
  }

  // Upsert en veterinario_profiles
  // Si no existe lo crea, si existe lo actualiza — una sola operación
  const { error: vetError } = await supabase
    .from('veterinario_profiles')
    .upsert({
      id: user.id,
      bio: parsed.data.bio || null,
      license_number: parsed.data.license_number,
      specialty: parsed.data.specialty,
      consultation_fee: parsed.data.consultation_fee ?? null,
      years_experience: parsed.data.years_experience ?? null,
    })

  if (vetError) {
    return { error: 'Error al actualizar el perfil profesional.' }
  }

  revalidatePath('/dashboard/veterinario/perfil')
  revalidatePath('/dashboard/veterinario')

  return { success: true }
}