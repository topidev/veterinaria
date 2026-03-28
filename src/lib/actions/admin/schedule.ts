// src/lib/actions/admin/schedule.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { scheduleSchema, TURNOS, type ScheduleFormData } from '@/lib/validations/schedule'

type ActionResult = { error: string } | { success: true }

export async function setVetSchedule(data: ScheduleFormData): Promise<ActionResult> {
  const parsed = scheduleSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Datos inválidos. Verifica el formulario.' }
  }

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

  const turno = TURNOS[parsed.data.turno]

  // Estrategia: borrar todos los horarios existentes del vet
  // e insertar los nuevos. Más simple que hacer diff.
  const { error: deleteError } = await supabase
    .from('vet_schedules')
    .delete()
    .eq('vet_id', parsed.data.vet_id)

  if (deleteError) {
    return { error: 'Error al actualizar el horario.' }
  }

  // Insertar un registro por cada día seleccionado
  const schedules = parsed.data.dias.map((day) => ({
    vet_id: parsed.data.vet_id,
    day_of_week: day,
    start_time: turno.start,
    end_time: turno.end,
    slot_duration: parseInt(parsed.data.slot_duration),
    is_active: true,
  }))

  const { error: insertError } = await supabase
    .from('vet_schedules')
    .insert(schedules)

  if (insertError) {
    return { error: 'Error al guardar el horario.' }
  }

  revalidatePath('/dashboard/admin/veterinarios')
  return { success: true }
}