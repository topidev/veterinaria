// src/lib/validations/schedule.ts
import { z } from 'zod'

export const TURNOS = {
  matutino:   { start: '08:00', end: '14:00', label: 'Matutino (8:00 - 14:00)' },
  vespertino: { start: '14:00', end: '20:00', label: 'Vespertino (14:00 - 20:00)' },
} as const

export type TurnoKey = keyof typeof TURNOS

export const DIAS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
] as const

export const scheduleSchema = z.object({
  vet_id: z.string().uuid('ID de veterinario inválido'),

  turno: z.enum(['matutino', 'vespertino'], {
    error: 'Selecciona un turno',
  }),

  dias: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Selecciona al menos un día'),

  slot_duration: z.enum(['30', '60'], {
    error: 'Selecciona la duración por cita',
  }),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>