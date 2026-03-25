'use server'

import { createClient } from "@/lib/supabase/server"
import { clienteProfileSchema, type ClienteProfileFormData } from "@/lib/validations/cliente"
import { revalidatePath } from "next/cache"
import { redirect } from "next/dist/server/api-utils"

type ActionResult = { error: string } | { success: true }

export async function updateClientProfile(data: ClienteProfileFormData): Promise<ActionResult> {
  const parsed = clienteProfileSchema.safeParse(data)

  if (!parsed.success) {

    return { error: 'Datos inválidos. Verifica el formulario' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado. ' }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: 'Error al actualizar el perfil' }
  }

  const emergency_contact =
    parsed.data.emergency_name ? {
      name: parsed.data.emergency_name,
      phone: parsed.data.emergency_phone || '',
      relation: parsed.data.emergency_relation
    } :
      null

  const { error: clienteError } = await supabase
    .from('cliente_profiles')
    .upsert({
      id: user.id,
      address: parsed.data.address || null,
      emergency_contact
    })

  if (clienteError) {
    return { error: 'Error al actualizar el perfil' }
  }

  revalidatePath('dashboard/cliente/perfil')
  revalidatePath('dashboard/cliente')

  return { success: true }
}