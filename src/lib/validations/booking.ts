// src/lib/validations/booking.ts
import { z } from 'zod'

export const bookingSchema = z.object({
  vet_id:         z.string().uuid('Selecciona un veterinario'),
  pet_id:         z.string().uuid('Selecciona una mascota'),
  scheduled_date: z.string().min(1, 'Selecciona una fecha'),
  scheduled_time: z.string().min(1, 'Selecciona un horario'),
  service_ids:    z.array(z.string().uuid()).min(1, 'Selecciona al menos un servicio'),
  notes:          z.string().max(300).optional().or(z.literal('')),
})

export type BookingFormData = z.infer<typeof bookingSchema>