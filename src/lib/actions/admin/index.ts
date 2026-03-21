// src/lib/actions/admin/index.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type ActionResult = { error: string } | { success: true }

// ─── Invitar veterinario ───────────────────────────────────────────────────────

export async function inviteVeterinario(
  email: string,
  fullName: string
): Promise<ActionResult> {
  const supabase = await createClient()

  // Verificar que quien llama es admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }


  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Sin permisos para realizar esta acción.' }
  }

  // inviteUserByEmail envía el email automáticamente.
  // El vet hace click en el link, setea su contraseña y queda activo.
  // El trigger handle_new_user crea su profile con role='veterinario'.
  console.log("[Enviando Invitación a ]: ", email + ": " + fullName)

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: 'veterinario',
    },
  })


  console.log("[ERROR]: ", error)
  if (error) {
    if (error.message.includes('already been registered')) {
      return { error: 'Ya existe una cuenta con ese correo.' }
    }
    return { error: 'Error al enviar la invitación. Intenta de nuevo.' }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

// ─── Verificar veterinario ─────────────────────────────────────────────────────

export async function verifyVeterinario(vetId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Sin permisos para realizar esta acción.' }
  }

  // Verificar que existe el registro en veterinario_profiles
  // Si no existe (vet nuevo que no completó su perfil), lo creamos
  const { data: existing } = await supabase
    .from('veterinario_profiles')
    .select('id')
    .eq('id', vetId)
    .single()

  if (!existing) {
    // Crear el registro con is_verified=true
    const { error } = await supabase
      .from('veterinario_profiles')
      .insert({ id: vetId, is_verified: true })

    if (error) return { error: 'Error al verificar el veterinario.' }
  } else {
    // Actualizar is_verified
    const { error } = await supabase
      .from('veterinario_profiles')
      .update({ is_verified: true })
      .eq('id', vetId)

    if (error) return { error: 'Error al verificar el veterinario.' }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

// ─── Desactivar cuenta ─────────────────────────────────────────────────────────

export async function toggleUserActive(
  targetId: string,
  isActive: boolean
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Sin permisos para realizar esta acción.' }
  }

  // Nunca desactivar tu propia cuenta
  if (targetId === user.id) {
    return { error: 'No puedes desactivar tu propia cuenta.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', targetId)

  if (error) return { error: 'Error al actualizar la cuenta.' }

  revalidatePath('/dashboard/admin')
  return { success: true }
}