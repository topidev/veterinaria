// src/lib/actions/reservaciones/index.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bookingSchema, type BookingFormData } from '@/lib/validations/booking'

type ActionResult = { error: string } | { success: true; appointmentId: string }

// ─── Crear cita ────────────────────────────────────────────────────────────────

export async function createAppointment(data: BookingFormData): Promise<ActionResult> {
  const parsed = bookingSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Datos inválidos. Verifica el formulario.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // Verificar que el slot sigue disponible al momento de confirmar
  // (alguien más pudo haberlo tomado mientras el cliente llenaba el form)
  const { data: conflict } = await supabase
    .from('appointments')
    .select('id')
    .eq('vet_id', parsed.data.vet_id)
    .eq('scheduled_date', parsed.data.scheduled_date)
    .eq('scheduled_time', parsed.data.scheduled_time)
    .not('status', 'eq', 'cancelled')
    .single()

  if (conflict) {
    return { error: 'Este horario ya fue reservado. Elige otro.' }
  }

  // Obtener precios actuales de los servicios seleccionados
  const { data: services } = await supabase
    .from('services')
    .select('id, base_price')
    .in('id', parsed.data.service_ids)
    .eq('is_active', true)

  if (!services || services.length !== parsed.data.service_ids.length) {
    return { error: 'Uno o más servicios no están disponibles.' }
  }

  // Calcular totales
  const subtotal = services.reduce((sum, s) => sum + Number(s.base_price), 0)
  const total = subtotal // sin descuentos por ahora

  // Crear la cita
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      client_id:      user.id,
      pet_id:         parsed.data.pet_id,
      vet_id:         parsed.data.vet_id,
      scheduled_date: parsed.data.scheduled_date,
      scheduled_time: parsed.data.scheduled_time,
      notes:          parsed.data.notes || null,
      status:         'pending',
      type:           'scheduled',
      subtotal,
      total,
    })
    .select('id')
    .single()

  if (appointmentError || !appointment) {
    return { error: 'Error al crear la cita. Intenta de nuevo.' }
  }

  // Insertar los servicios de la cita con su precio actual (snapshot)
  const appointmentServices = services.map((s) => ({
    appointment_id: appointment.id,
    service_id:     s.id,
    price_at_time:  s.base_price,
    quantity:       1,
  }))

  const { error: servicesError } = await supabase
    .from('appointment_services')
    .insert(appointmentServices)

  if (servicesError) {
    // Si falla el insert de servicios, borrar la cita para no dejarla incompleta
    await supabase.from('appointments').delete().eq('id', appointment.id)
    return { error: 'Error al registrar los servicios.' }
  }

  revalidatePath('/dashboard/cliente')
  revalidatePath('/dashboard/veterinario')
  revalidatePath('/dashboard/admin')

  return { success: true, appointmentId: appointment.id }
}

// ─── Obtener slots disponibles ─────────────────────────────────────────────────
// Esta función calcula los slots libres para un vet en una fecha específica.
// Se llama desde el Client Component cuando el usuario selecciona fecha.

export async function getAvailableSlots(
  vetId: string,
  date: string // formato YYYY-MM-DD
): Promise<{ slots: string[]; error?: string }> {
  const supabase = await createClient()

  // Obtener el día de la semana de la fecha seleccionada
  // getUTCDay() evita problemas de timezone — 0=Dom, 1=Lun...
  const dayOfWeek = new Date(date + 'T12:00:00').getUTCDay()

  // Obtener el horario del vet para ese día
  const { data: schedule } = await supabase
    .from('vet_schedules')
    .select('start_time, end_time, slot_duration')
    .eq('vet_id', vetId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .single()

  if (!schedule) {
    return { slots: [], error: 'El veterinario no trabaja ese día.' }
  }

  // Generar todos los slots posibles del horario
  const allSlots = generateSlots(
    schedule.start_time,
    schedule.end_time,
    schedule.slot_duration
  )

  // Obtener citas ya ocupadas en esa fecha
  const { data: bookedAppointments } = await supabase
    .from('appointments')
    .select('scheduled_time')
    .eq('vet_id', vetId)
    .eq('scheduled_date', date)
    .not('status', 'eq', 'cancelled')

  const bookedTimes = new Set(
    (bookedAppointments ?? []).map((a) => a.scheduled_time.slice(0, 5))
  )

  // Filtrar slots ocupados Y slots pasados si es hoy
  const now = new Date()
  const isToday = date === now.toISOString().split('T')[0]
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const availableSlots = allSlots.filter((slot) => {
    if (bookedTimes.has(slot)) return false
    if (isToday && slot <= currentTime) return false
    return true
  })

  return { slots: availableSlots }
}

// Helper: genera todos los slots de un horario
function generateSlots(
  startTime: string,
  endTime: string,
  slotDuration: number
): string[] {
  const slots: string[] = []

  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  let currentMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  // El último slot debe terminar antes o en el fin del horario
  while (currentMinutes + slotDuration <= endMinutes) {
    const h = Math.floor(currentMinutes / 60)
    const m = currentMinutes % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    currentMinutes += slotDuration
  }

  return slots
}