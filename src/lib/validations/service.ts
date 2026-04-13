// src/lib/validations/service.ts
import { z } from 'zod'

export const CATEGORIES = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'vacuna', label: 'Vacuna / Medicamento' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'cirugia', label: 'Cirugía' },
  { value: 'otro', label: 'Otro' },
] as const

export const serviceSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'Máximo 100 caracteres'),

  description: z
    .string()
    .max(300, 'Máximo 300 caracteres')
    .optional()
    .or(z.literal('')),

  base_price: z
    .number({ message: 'Ingresa un precio válido' })
    .min(0, 'El precio no puede ser negativo'),

  duration_minutes: z
    .number({ message: 'Ingresa una duración válida' })
    .int()
    .min(5, 'Mínimo 5 minutos')
    .max(480, 'Máximo 8 horas'),

  category: z.enum(
    ['consulta', 'vacuna', 'grooming', 'cirugia', 'otro'],
    { error: 'Selecciona una categoría' }
  ),
})

export type ServiceFormData = z.infer<typeof serviceSchema>