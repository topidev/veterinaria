// src/components/admin/ScheduleModal.tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  scheduleSchema,
  TURNOS,
  DIAS,
  type ScheduleFormData,
  type TurnoKey,
} from '@/lib/validations/schedule'
import { setVetSchedule } from '@/lib/actions/admin/schedule'
import type { VetSchedule } from '@/types/supabase'

interface ScheduleModalProps {
  vetId: string
  vetName: string | null
  currentSchedules: VetSchedule[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScheduleModal({
  vetId,
  vetName,
  currentSchedules,
  open,
  onOpenChange,
}: ScheduleModalProps) {
  const [isPending, startTransition] = useTransition()

  // Inferir valores actuales del horario existente
  const currentDias = currentSchedules.map((s) => s.day_of_week)
  const currentTurno = currentSchedules.length > 0
    ? currentSchedules[0].start_time === '08:00:00' ? 'matutino' : 'vespertino'
    : 'matutino'
  const currentSlot = currentSchedules.length > 0
    ? String(currentSchedules[0].slot_duration) as '30' | '60'
    : '30'

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      vet_id: vetId,
      turno: currentTurno,
      dias: currentDias,
      slot_duration: currentSlot,
    },
  })

  const selectedDias = watch('dias') ?? []
  const selectedTurno = watch('turno')

  const onSubmit = (data: ScheduleFormData) => {
    startTransition(async () => {
      const result = await setVetSchedule(data)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Horario actualizado correctamente')
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Horario de {vetName ?? 'veterinario'}</DialogTitle>
          <DialogDescription>
            Configura los días y turno de trabajo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">

          {/* Días de la semana */}
          <div className="space-y-2">
            <Label>Días de trabajo</Label>
            <Controller
              name="dias"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-4 gap-2">
                  {DIAS.map((dia) => {
                    const isSelected = field.value?.includes(dia.value)
                    return (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => {
                          const current = field.value ?? []
                          field.onChange(
                            isSelected
                              ? current.filter((d) => d !== dia.value)
                              : [...current, dia.value]
                          )
                        }}
                        className={`
                          rounded-lg border py-2 px-1 text-xs font-medium transition-colors
                          ${isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:border-muted-foreground/50'
                          }
                        `}
                      >
                        {dia.label.slice(0, 3)}
                      </button>
                    )
                  })}
                </div>
              )}
            />
            {errors.dias && (
              <p className="text-xs text-destructive">{errors.dias.message}</p>
            )}
          </div>

          {/* Turno */}
          <div className="space-y-2">
            <Label>Turno</Label>
            <Controller
              name="turno"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(TURNOS) as [TurnoKey, typeof TURNOS[TurnoKey]][]).map(
                    ([key, turno]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => field.onChange(key)}
                        className={`
                          rounded-lg border p-3 text-left transition-colors
                          ${field.value === key
                            ? 'bg-primary/5 border-primary'
                            : 'bg-background border-border hover:border-muted-foreground/50'
                          }
                        `}
                      >
                        <p className="text-sm font-medium capitalize">{key}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {turno.start} - {turno.end}
                        </p>
                      </button>
                    )
                  )}
                </div>
              )}
            />
            {errors.turno && (
              <p className="text-xs text-destructive">{errors.turno.message}</p>
            )}
          </div>

          {/* Duración por cita */}
          <div className="space-y-2">
            <Label>Duración por cita</Label>
            <Controller
              name="slot_duration"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {(['30', '60'] as const).map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => field.onChange(duration)}
                      className={`
                        rounded-lg border py-2.5 text-sm font-medium transition-colors
                        ${field.value === duration
                          ? 'bg-primary/5 border-primary'
                          : 'bg-background border-border hover:border-muted-foreground/50'
                        }
                      `}
                    >
                      {duration} minutos
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Preview del horario */}
          {selectedDias.length > 0 && (
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <p className="font-medium mb-1">Resumen del horario</p>
              <p className="text-muted-foreground text-xs">
                {DIAS.filter((d) => selectedDias.includes(d.value))
                  .map((d) => d.label.slice(0, 3))
                  .join(', ')}{' '}
                · {TURNOS[selectedTurno as TurnoKey]?.start} -{' '}
                {TURNOS[selectedTurno as TurnoKey]?.end}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar horario'}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}