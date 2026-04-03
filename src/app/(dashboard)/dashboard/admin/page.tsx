// src/app/(dashboard)/dashboard/admin/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, Stethoscope, CalendarDays, DollarSign, ShieldCheck, ShieldAlert, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { InviteVetButton } from '@/components/admin/InviteVetButton'
import { VerifyVetButton } from '@/components/admin/VerifyVetButton'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Panel de administración' }

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  in_progress: "En atención",
  completed: "Completada",
  canceled: "Cancelada",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-600, border-amber-300",
  confirmed: "text-blue-600, border-blue-300",
  in_progress: "text-purple-600, border-purple-300",
  completed: "text-green-600, border-green-300",
  canceled: "text-red-600, border-red-300",
}


function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours}h`
  return `hace ${days}d`
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = today.slice(0, 7) + '-01'

  // Todas las queries en paralelo
  const [
    { count: totalClientes },
    { count: totalVets },
    { count: citasHoy },
    { data: ingresosMes },
    { data: vets },
    { data: citasDelDia },
    { data: recentUsers },
  ] = await Promise.all([
    // Total clientes
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'cliente')
      .eq('is_active', true),

    // Total veterinarios
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'veterinario')
      .eq('is_active', true),

    // Total de citas hoy
    supabase
      .from("appointments")
      .select("*", { count: 'exact', head: true })
      .eq('schedule_date', today).not('status', 'eq', 'cancelled'),

    // Ingresos del Mes
    supabase
      .from('appointments')
      .select('total')
      .eq('status', 'completed').gte('scheduled_date', firstOfMonth),

    // Lista de veterinarios con su perfil extendido
    supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        created_at,
        is_active,
        veterinario_profiles (
          is_verified,
          specialty,
          license_number
        )
      `)
      .eq('role', 'veterinario')
      .order('created_at', { ascending: false }),

    // Citas del día - 5 primeras citas
    supabase
      .from('appointments')
      .select(`
        id, scheduled_time, status, total, 
        pets:pet_id (name),
        vet: vet_id (full_name),
        client: client_id (full_name),
      `)
      .eq('scheduled_date', today)
      .not('status', 'eq', 'cancelled')
      .order('scheduled_date').limit(5),

    // Actividad reciente — últimos 5 usuarios registrados
    supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])



  const vetList = vets ?? []
  const pendingVets = vetList.filter(
    (v) => !(v.veterinario_profiles as any)?.is_verified
  )
  const totalIngresos = (ingresosMes ?? []).reduce((sum, a) => sum + Number(a.total), 0)


  return (
    <div className="space-y-6 w-full m-auto max-w-375">

      {/* Header */}
      <div className="flex items-center gap-2 justify-between flex-col text-center md:flex-row md:text-left">
        <div>
          <h1 className="text-2xl font-semibold">Panel de administración</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vista general del sistema
          </p>
        </div>
        <InviteVetButton />
      </div>

      {/* Alerta si hay vets pendientes de verificación */}
      {pendingVets.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium">{pendingVets.length} veterinario{pendingVets.length > 1 ? 's' : ''}</span>
            {' '}pendiente{pendingVets.length > 1 ? 's' : ''} de verificación
          </p>
        </div>
      )}

      {/* Métricas reales */}
      <div className="flex items-stretch justify-between gap-2 flex-col md:flex-row">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Citas de hoy</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(citasDelDia ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Sin citas para hoy</p>
              </div>
            ) : (
              <div className="divide-y">
                {(citasDelDia ?? []).map((cita) => (
                  <div key={cita.id} className="flex items-center gap-3 px-6 py-3">
                    <span className="text-sm font-medium w-12 shrink-0">
                      {cita.scheduled_time.slice(0, 5)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {(cita.pets as any)?.name} — {(cita.client as any)?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dr. {(cita.vet as any)?.full_name}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_COLORS[cita.status]}`}>
                      {STATUS_LABELS[cita.status]}
                    </Badge>
                    <span className="text-sm font-medium shrink-0">
                      ${Number(cita.total).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actividad reciente */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentUsers ?? []).map((u) => (
              <div key={u.id} className="flex items-center gap-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(u.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {u.full_name ?? 'Usuario'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nuevo {u.role} · {timeAgo(u.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalClientes ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Registrados activos</p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />Ingresos mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              ${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Citas completadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-stretch gap-2 justify-between flex-col md:flex-row">

        {/* Veterinarios — tabla con verificación */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Veterinarios</CardTitle>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/dashboard/admin/veterinarios">Ver todos ({totalVets})</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {vetList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Stethoscope className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Sin veterinarios registrados</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Invita al primer veterinario para comenzar
                </p>
                <InviteVetButton variant="outline" />
              </div>
            ) : (
              <div className="divide-y">
                {vetList.slice(0, 5).map((vet) => {
                  const vetProf = vet.veterinario_profiles as any
                  return (
                    <div
                      key={vet.id}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={vet.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(vet.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {vet.full_name ?? 'Sin nombre'}
                        </p>
                        {vetProf?.specialty?.length > 0 && (
                          <p className="text-xs text-muted-foreground truncate">
                            {vetProf.specialty.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {vetProf?.is_verified ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300 dark:text-green-400">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        ) : (
                          <VerifyVetButton vetId={vet.id} vetName={vet.full_name} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="w-full">
          {/* <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Veterinarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalVets ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingVets.length > 0
                ? `${pendingVets.length} sin verificar`
                : 'Todos verificados'}
            </p>
          </CardContent> */}
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />Total citas hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{citasHoy ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Sin canceladas</p>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}