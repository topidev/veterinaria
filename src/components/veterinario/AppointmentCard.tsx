// src/components/veterinario/AppointmentCard.tsx
'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { PawPrint, User, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { updateAppointmentStatus } from '@/lib/actions/veterinario/appointments'
import type { AppointmentStatus } from '@/types/supabase'

// Configuración visual por status
const STATUS_CONFIG: Record<AppointmentStatus, {
  label: string
  color: string
}> = {
  pending:     { label: 'Pendiente',   color: 'text-amber-600 border-amber-300 dark:text-amber-400' },
  confirmed:   { label: 'Confirmada',  color: 'text-blue-600 border-blue-300 dark:text-blue-400' },
  in_progress: { label: 'En atención', color: 'text-purple-600 border-purple-300 dark:text-purple-400' },
  completed:   { label: 'Completada',  color: 'text-green-600 border-green-300 dark:text-green-400' },
  cancelled:   { label: 'Cancelada',   color: 'text-red-600 border-red-300 dark:text-red-400' },
}

// Acciones disponibles por status
const NEXT_ACTIONS: Record<AppointmentStatus, {
  status: AppointmentStatus
  label: string
  variant: 'default' | 'outline' | 'destructive'
}[]> = {
  pending:     [
    { status: 'confirmed',   label: 'Confirmar',   variant: 'default' },
    { status: 'cancelled',   label: 'Cancelar',    variant: 'destructive' },
  ],
  confirmed:   [
    { status: 'in_progress', label: 'Iniciar atención', variant: 'default' },
    { status: 'cancelled',   label: 'Cancelar',         variant: 'destructive' },
  ],
  in_progress: [
    { status: 'completed',   label: 'Completar',   variant: 'default' },
  ],
  completed:   [],
  cancelled:   [],
}

export type AppointmentWithDetails = {
  id: string
  scheduled_time: string
  status: AppointmentStatus
  type: string
  notes: string | null
  vet_notes: string | null
  total: number
  pets: { name: string; species: string } | null
  client: { full_name: string | null } | null
  appointment_services: {
    price_at_time: number
    quantity: number
    services: { name: string } | null
  }[]
}

export function AppointmentCard({ appointment }: { appointment: AppointmentWithDetails }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  const config = STATUS_CONFIG[appointment.status]
  const actions = NEXT_ACTIONS[appointment.status]

  const handleAction = (newStatus: AppointmentStatus) => {
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointment.id, newStatus)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(`Cita ${STATUS_CONFIG[newStatus].label.toLowerCase()}`)
    })
  }

  return (
    <Card className={appointment.status === 'cancelled' ? 'opacity-60' : undefined}>
      <CardContent className="p-4">

        {/* Fila principal */}
        <div className="flex items-center gap-3">

          {/* Hora */}
          <div className="shrink-0 text-center min-w-13">
            <p className="text-lg font-semibold leading-none">
              {appointment.scheduled_time.slice(0, 5)}
            </p>
            {appointment.type === 'walk_in' && (
              <span className="text-xs text-muted-foreground">walk-in</span>
            )}
          </div>

          <div className="w-px h-10 bg-border shrink-0" />

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <PawPrint className="h-3.5 w-3.5 text-muted-foreground" />
                {appointment.pets?.name ?? 'Mascota'} — {appointment.pets?.species}
              </div>
              <Badge variant="outline" className={`text-xs ${config.color}`}>
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <User className="h-3 w-3" />
              {appointment.client?.full_name ?? 'Cliente'}
            </div>
          </div>

          {/* Total + acciones + expand */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium hidden sm:block">
              ${Number(appointment.total).toFixed(0)}
            </span>

            {actions.map((action) => (
              <Button
                key={action.status}
                variant={action.variant}
                size="sm"
                className="text-xs h-7"
                disabled={isPending}
                onClick={() => handleAction(action.status)}
              >
                {action.label}
              </Button>
            ))}

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Detalle expandido */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3 text-sm">

            {/* Servicios */}
            {appointment.appointment_services.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Servicios</p>
                <div className="space-y-1">
                  {appointment.appointment_services.map((as, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{as.services?.name}</span>
                      <span className="text-muted-foreground">
                        ${Number(as.price_at_time).toFixed(0)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium pt-1 border-t">
                    <span>Total</span>
                    <span>${Number(appointment.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notas del cliente */}
            {appointment.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notas del cliente</p>
                <p className="text-sm bg-muted/50 rounded-lg px-3 py-2">{appointment.notes}</p>
              </div>
            )}

            {/* Notas del vet */}
            {appointment.vet_notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Mis notas</p>
                <p className="text-sm bg-muted/50 rounded-lg px-3 py-2">{appointment.vet_notes}</p>
              </div>
            )}

          </div>
        )}

      </CardContent>
    </Card>
  )
}