// src/app/(dashboard)/dashboard/veterinario/agenda/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppointmentCard } from '@/components/veterinario/AppointmentCard'
import { CalendarDays } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi agenda' }

export default async function VetAgendaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fecha de hoy en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0]

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_time,
      status,
      type,
      notes,
      vet_notes,
      total,
      pets:pet_id ( name, species ),
      client:client_id ( full_name ),
      appointment_services (
        price_at_time,
        quantity,
        services:service_id ( name )
      )
    `)
    .eq('vet_id', user.id)
    .eq('scheduled_date', today)
    .order('scheduled_time', { ascending: true })

  const appts = appointments ?? []

  // Separar por status para mostrar primero las activas
  const active   = appts.filter((a) => !['completed', 'cancelled'].includes(a.status))
  const finished = appts.filter((a) => ['completed', 'cancelled'].includes(a.status))

  return (
    <div className="space-y-6 w-full max-w-375 m-auto">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mi agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('es-MX', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        {/* Métricas rápidas del día */}
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold">{active.length}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{finished.filter(a => a.status === 'completed').length}</p>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </div>
        </div>
      </div>

      {/* Citas activas */}
      {active.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Por atender
          </h2>
          {active.map((a) => (
            <AppointmentCard key={a.id} appointment={a as any} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="font-medium">Sin citas pendientes hoy</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Todas las citas del día están atendidas
          </p>
        </div>
      )}

      {/* Citas terminadas */}
      {finished.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Completadas / Canceladas
          </h2>
          {finished.map((a) => (
            <AppointmentCard key={a.id} appointment={a as any} />
          ))}
        </div>
      )}

    </div>
  )
}