// src/lib/actions/admin/services.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { serviceSchema, type ServiceFormData } from '@/lib/validations/service'

type ActionResult = { error: string } | { success: true }

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.', supabase: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Sin permisos.', supabase: null }
  }

  return { error: null, supabase }
}

export async function createService(data: ServiceFormData): Promise<ActionResult> {
  const parsed = serviceSchema.safeParse(data)
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const { error: authError, supabase } = await verifyAdmin()
  if (authError || !supabase) return { error: authError ?? 'Error.' }

  const { error } = await supabase.from('services').insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    base_price: parsed.data.base_price,
    duration_minutes: parsed.data.duration_minutes,
    category: parsed.data.category,
  })

  if (error) return { error: 'Error al crear el servicio.' }

  revalidatePath('/dashboard/admin/servicios')
  return { success: true }
}

export async function updateService(
  id: string,
  data: ServiceFormData
): Promise<ActionResult> {
  const parsed = serviceSchema.safeParse(data)
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const { error: authError, supabase } = await verifyAdmin()
  if (authError || !supabase) return { error: authError ?? 'Error.' }

  const { error } = await supabase
    .from('services')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      base_price: parsed.data.base_price,
      duration_minutes: parsed.data.duration_minutes,
      category: parsed.data.category,
    })
    .eq('id', id)

  if (error) return { error: 'Error al actualizar el servicio.' }

  revalidatePath('/dashboard/admin/servicios')
  return { success: true }
}

export async function toggleServiceActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const { error: authError, supabase } = await verifyAdmin()
  if (authError || !supabase) return { error: authError ?? 'Error.' }

  const { error } = await supabase
    .from('services')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: 'Error al actualizar el servicio.' }

  revalidatePath('/dashboard/admin/servicios')
  return { success: true }
}