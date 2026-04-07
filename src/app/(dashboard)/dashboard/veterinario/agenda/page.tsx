// src/app/(dashboard)/dashboard/veterinario/agenda/page.tsx
// Server Component — lee searchParams para saber qué semana mostrar
// El WeekNavigator (Client) solo cambia la URL, este componente hace el fetch
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WeekNavigator } from '@/components/veterinario/WeekNavigator'
import { DayColumn } from '@/components/veterinario/DayColumn'
import type { Metadata } from 'next'
import type { AppointmentWithDetails } from '@/components/veterinario/AppointmentCard'

export const metadata: Metadata = { title: 'Mi agenda' }

function getMonday(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  console.log("[Date]:",date)
  const day = date.getUTCDay()
  console.log("[Day]:",day)
  const diff = day === 0 ? -6 : 1 -day
  console.log("[Difference]:",diff)
  date.setUTCDate(date.getUTCDate() +  diff)
  console.log("[Date UTC]:",date)
  
  return date.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().split('T')[0]
}

interface AgendaPageProps {
  searchParams: Promise<{ semana?: string }>
}

export default async function VetAgendaPage({ searchParams}: AgendaPageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  
  const params = await searchParams
  // Fecha de hoy en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0]

  const weekStart = params.semana
    ? getMonday(params.semana)
    : getMonday(today)
  
  const weekEnd = addDays(weekStart, 6)

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      type,
      notes,
      vet_notes,
      total,
      pets:pet_id ( name, species ),
      client:profiles!client_id ( full_name ),
      appointment_services (
        price_at_time,
        quantity,
        services:service_id ( name )
      )
    `)
    .eq('vet_id', user.id)
    .gte('scheduled_date', weekStart)
    .lte('scheduled_date', weekEnd)
    .order('scheduled_time', { ascending: true })
  
  console.log("[Appointments]: ", appointments)

  // Agrupar citas por fecha para pasarlas a cada DayColumn
  const apptsByDate = (appointments ?? []).reduce((acc, a) => {
    const date = a.scheduled_date
    if(!acc[date]) acc[date] = []
    acc[date].push(a)
    return acc
  }, {} as Record<string, typeof appointments>)

  console.log("[Appointmets GroupBy Date]: ", apptsByDate)

  const days = Array.from({ length: 7}, (_, i) => addDays(weekStart, i))

  const totalSemana = (appointments ?? []).filter(
    (a) => !['cancelled'].includes(a.status)
  ).length

  const completadas = (appointments ?? []).filter(
    (a) => a.status === 'completed'
  ).length

  return (
    <div className="space-y-6 w-full m-auto max-w-375">
 
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mi agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalSemana} cita{totalSemana !== 1 ? 's' : ''} esta semana
            {completadas > 0 && ` · ${completadas} completada${completadas !== 1 ? 's' : ''}`}
          </p>
        </div>
        <WeekNavigator weekStart={weekStart} />
      </div>
 
      {/* Vista semanal — un DayColumn por día */}
      <div className="space-y-3">
        {days.map((date) => (
          <DayColumn
            key={date}
            date={date}
            appointments={(apptsByDate[date] ?? []) as AppointmentWithDetails[]}
            isToday={date === today}
          />
        ))}
      </div>
 
    </div>
  )
}