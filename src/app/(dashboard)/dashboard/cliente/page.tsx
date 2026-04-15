// src/app/(dashboard)/cliente/page.tsx
import { PetCard } from '@/components/mascotas/PetCard'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { CalendarDays, Clock, PawPrint, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Mi dashboard' }

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  in_progress: 'En atención',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-600 border-amber-300',
  confirmed: 'text-blue-600 border-blue-300',
  in_progress: 'text-purple-600 border-purple-300',
  completed: 'text-green-600 border-green-300',
  cancelled: 'text-red-600 border-red-300',
}

export default async function ClienteDashboardPage() {

  // Usemos el cliente de Supabase
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split("T")[0]

  // Buscamos en paralelo en Supabase
  const [
    { data: profile },
    { data: pets },
    { data: nextAppointment }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('pets')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('appointments')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        status,
        pets: pet_id (name),
        vet:vet_id (full_name)
      `)
      .eq('client_id', user.id)
      .gte('scheduled_date', today)
      .not('status', 'eq', 'cancelled')
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(1)
      .maybeSingle()
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Client'
  const petList = pets ?? []

  return (
    <div className="space-y-6 w-full m-auto max-w-375">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-col md:flex-row">
        <div>
          <h1 className="text-2xl font-semibold">
            Bienvenido, {firstName} 👋
          </h1>
          <p className=" hidden md:block text-sm text-muted-foreground mt-1">
            Aquí está el resumen de tus mascotas
          </p>
        </div>
        <Button asChild>
          <Link href="/reservaciones">
            <CalendarDays className="h-4 w-4 mr-2" />
            Reservar cita
          </Link>
        </Button>
      </div>

      {/* Métricas */}
      <div className="flex flex-col items-stretch justify-between gap-2 md:flex-row max-w-96 mx-auto md:max-w-none">
        <Card className='w-full'>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mis mascotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-semibold">{petList.length}</span>
            </div>
          </CardContent>
        </Card>


        {/* Citas */}    
        <Card className='w-full'>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próxima cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div className="flex flex-col lg:flex-row items-start justify-between  gap-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-sm">
                      {(nextAppointment.pets as any)?.name} con{' '}
                      Dr. {(nextAppointment.vet as any)?.full_name?.split(' ')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 md:hidden" />
                      {new Date(nextAppointment.scheduled_date + 'T12:00:00')
                        .toLocaleDateString('es-MX', {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })}
                      {' · '}
                      {nextAppointment.scheduled_time.slice(0, 5)} hrs
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs self-end shrink-0 ${STATUS_COLORS[nextAppointment.status]}`}
                >
                  {STATUS_LABELS[nextAppointment.status]}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-5 w-5" />
                <span className="text-sm">Sin citas próximas</span>
                <Button variant="link" size="sm" className="h-auto p-0 ml-1" asChild>
                  <Link href="/reservaciones">Agendar ahora</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sección mascotas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mis mascotas</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/cliente/mascotas">
              Ver todas
            </Link>
          </Button>
        </div>

        {petList.length === 0 ? (
          // Estado vacío — primera vez del usuario
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <PawPrint className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-medium mb-1">Aún no tienes mascotas registradas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Agrega tu primera mascota para comenzar a agendar citas
              </p>
              <Button asChild>
                <Link href="/dashboard/cliente/mascotas">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar mascota
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Grid de mascotas — máximo 3 en el dashboard
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {petList.slice(0, 3).map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
            {petList.length > 3 && (
              <Card className="border-dashed flex items-center justify-center">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    +{petList.length - 3} mascotas más
                  </p>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/cliente/mascotas">Ver todas</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

    </div>
  )
}