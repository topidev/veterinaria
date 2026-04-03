// src/app/(dashboard)/veterinario/page.tsx
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CalendarDays, MessageSquare, TrendingUp, User, Clock, CheckCircle2 } from 'lucide-react'
import { AppointmentCard } from '@/components/veterinario/AppointmentCard'

export const metadata: Metadata = { title: 'Mi Agenda' }

export default async function VeterinarioDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = today.slice(0, 7) + '-01'

  const [
    { data: profile },
    { data: vetProfile },
    { data: todayAppts },
    { count: monthCount }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('veterinario_profiles')
      .select('specialty, consultation_fee, years_experience, is_verified, bio')
      .eq('id', user.id)
      .single(),
    supabase
      .from('appointments')
      .select(`
        id, scheduled_time, status, type, notes, vet_notes, total,
        pets: pet_id (name, species),
        client:client_id (full_name),
        appointment_services(
          price_at_time, quantity,
          services:service_id(name)
        )
      `)
      .eq('vet_id', user.id)
      .eq('scheduled_date', today)
      .not('status', 'eq', 'cancelled')
      .order('scheduled_time'),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .eq('vet_id', user.id)
      .gte('schedule_date', firstOfMonth)
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Dogtor'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tarde' : 'Buenas noches'
  const appts = todayAppts ?? []
  const pending = appts.filter((a) => ['pending', 'confirmed'].includes(a.status))

  return (
    <div className="space-y-6 w-full m-auto max-w-375">

      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-col md:flex-row">
        <div>
          <h1 className="text-2xl font-semibold">
            {greeting}, Dr. {firstName} 👨‍⚕️
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tu agenda de hoy
          </p>
        </div>
        {vetProfile && !vetProfile.is_verified && (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950">
            Pendiente de verificación
          </Badge>
        )}
      </div>

      {/* Métricas — placeholders hasta Sprint 3 */}
      <div className="flex flex-col items-stretch justify-between gap-2 md:flex-row">
        <Card className='w-full'>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />Citas hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{appts.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className='w-full'>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Disponible en Sprint 5</p>
          </CardContent>
        </Card>

        <Card className='w-full'>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />Consultas este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{monthCount ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Completadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-2 md:flex-row">

        {/* Agenda del día — placeholder */}
        <Card className="w-full md:w-2/3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Agenda de hoy</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/veterinario/agenda">Ver completa</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {appts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Sin citas hoy</p>
              </div>
            ) : (
              appts.slice(0, 3).map((a) => (
                <AppointmentCard key={a.id} appointment={a as any} />
              ))
            )}
            {appts.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href="/dashboard/veterinario/agenda">
                  Ver {appts.length - 3} más
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Perfil profesional — datos reales */}
        <Card className="w-full md:w-1/3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Mi perfil profesional</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/veterinario/perfil">Editar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!vetProfile ? (
              // El vet aún no ha completado su perfil extendido
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <User className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Perfil incompleto</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Completa tu perfil para que los clientes puedan encontrarte
                </p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/veterinario/perfil">Completar perfil</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">

                {vetProfile.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {vetProfile.bio}
                  </p>
                )}

                {vetProfile.specialty && vetProfile.specialty.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {vetProfile.specialty.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-1">
                  {vetProfile.years_experience && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{vetProfile.years_experience} años de experiencia</span>
                    </div>
                  )}
                  {vetProfile.consultation_fee && (
                    <div className="text-sm font-medium">
                      ${vetProfile.consultation_fee} / consulta
                    </div>
                  )}
                </div>

                {vetProfile.is_verified && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Perfil verificado
                  </div>
                )}

              </div>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  )
}