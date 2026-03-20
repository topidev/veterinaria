// src/app/(dashboard)/cliente/page.tsx
import { PetCard } from '@/components/mascotas/PetCard'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { CalendarDays, PawPrint, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Mi dashboard' }

export default async function ClienteDashboardPage() {

  // Usemos el cliente de Supabase
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscamos en paralelo en Supabase
  const [{ data: profile }, { data: pets }] = await Promise.all([
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
      .order('created_at', { ascending: false })
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Client'
  const petList = pets ?? []

  return (
    <div className="space-y-6 w-full m-auto max-w-[1500px]">

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
      <div className="flex flex-col items-stretch justify-between gap-2 md:flex-row">
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

        <Card className='w-full'>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próxima cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Sin citas agendadas
              </span>
            </div>
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