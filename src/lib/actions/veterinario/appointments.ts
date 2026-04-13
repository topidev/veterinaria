// src/lib/actions/veterinario/appointments.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'
import {
  appointmentConfirmedEmail,
  appointmentCancelledEmail,
} from '@/lib/email/templates'
import type { AppointmentStatus } from '@/types/supabase'

type ActionResult = { error: string } | { success: true }

// Transiciones válidas de status — el vet no puede saltar a cualquier estado
const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending:     ['confirmed', 'cancelled'],
  confirmed:   ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed:   [],
  cancelled:   [],
}

function formatDateForEmail(dateStr: string, timeStr: string) {
  const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  const MESES = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre']
  const d = new Date(dateStr + 'T12:00:00')
  return {
    date: `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getMonth()]} ${d.getUTCFullYear()}`, time: timeStr.slice(0, 5) + 'hrs',  
  }
}

async function getUserEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (error || !data.user) return null
  return data.user.email ?? null
}

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // Leer el status actual para validar la transición
  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      status,
      client_id, 
      vet_id,
      scheduled_time,
      scheduled_date,
      total,
      pets:pet_id ( name ),
      client:profiles!client_id ( full_name ),
      vet:profiles!vet_id ( full_name ),
      appointment_services (
        services:service_id ( name )
      )
    `)
    .eq('id', appointmentId)
    .single()

  if (!appointment) return { error: 'Cita no encontrada.' }

  // Solo el vet asignado o un admin puede cambiar el status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isVet = appointment.vet_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isVet && !isAdmin) {
    return { error: 'Sin permisos para modificar esta cita.' }
  }

  // Validar que la transición es válida
  const validNext = VALID_TRANSITIONS[appointment.status as AppointmentStatus]
  if (!validNext.includes(newStatus)) {
    return { error: `No se puede cambiar de ${appointment.status} a ${newStatus}.` }
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status: newStatus })
    .eq('id', appointmentId)

  if (error) return { error: 'Error al actualizar la cita.' }

  const { date, time } = formatDateForEmail(
    appointment.scheduled_date,
    appointment.scheduled_time
  )

  const petName = (appointment.pets as any)?.name ?? 'tu mascota'
  const vetName = (appointment.vet as any)?.full_name ?? 'el veterinario'
  const clientName = (appointment.client as any)?.full_name ?? 'Cliente'
  const services = ((appointment.appointment_services as any[]) ?? [])

  const emailData = {
    clientName, petName, vetName, date, time, services,
    total: Number(appointment.total),
  }

  if(newStatus === 'confirmed') {
    const clientEmail = await getUserEmail(appointment.client_id)
    if (clientEmail) {
      const { subject, html } = appointmentConfirmedEmail(emailData)
      await sendEmail({ to: clientEmail, subject, html })
    }
  }

  if (newStatus === 'cancelled') {
    const cancelledBy = isAdmin ? 'admin' : isVet ? 'veterinario' : 'cliente'
    const [clientEmail, vetEmail] = await Promise.all([
      getUserEmail(appointment.client_id),
      getUserEmail(appointment.vet_id),
    ])
    if(clientEmail) {
      const {subject, html } = appointmentCancelledEmail({
        ...emailData, cancelledBy, recipientName: clientName,
      })
      await sendEmail({ to: clientEmail, subject, html })
    }

    if (vetEmail && cancelledBy !== 'veterinario') {
      const { subject, html } = appointmentCancelledEmail( {
        ...emailData, cancelledBy, recipientName: `Dr. %{vetName}`
      })
      await sendEmail( { to: vetEmail, subject, html })
    }
  }


  revalidatePath('/dashboard/veterinario/agenda')
  revalidatePath('/dashboard/veterinario')
  revalidatePath('/dashboard/admin')

  return { success: true }
}

// Walk-in: el vet registra una cita de emergencia manualmente
export async function createWalkIn(data: {
  pet_id:    string
  client_id: string
  service_ids: string[]
  vet_notes?: string
}): Promise<ActionResult & { appointmentId?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // Obtener precios actuales
  const { data: services } = await supabase
    .from('services')
    .select('id, base_price')
    .in('id', data.service_ids)

  const subtotal = (services ?? []).reduce((sum, s) => sum + Number(s.base_price), 0)

  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      client_id:      data.client_id,
      pet_id:         data.pet_id,
      vet_id:         user.id,
      scheduled_date: date,
      scheduled_time: time,
      status:         'in_progress', // walk-in empieza directo en atención
      type:           'walk_in',
      vet_notes:      data.vet_notes || null,
      subtotal,
      total: subtotal,
    })
    .select('id')
    .single()

  if (error || !appointment) return { error: 'Error al registrar la cita.' }

  // Insertar servicios
  if (services && services.length > 0) {
    await supabase.from('appointment_services').insert(
      services.map((s) => ({
        appointment_id: appointment.id,
        service_id:     s.id,
        price_at_time:  s.base_price,
        quantity:       1,
      }))
    )
  }

  revalidatePath('/dashboard/veterinario/agenda')
  return { success: true, appointmentId: appointment.id }
}