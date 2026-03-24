// src/lib/validations/veterinario.ts
import { z } from 'zod'

export const vetProfileSchema = z.object({
  bio: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal('')),

  license_number: z
    .string()
    .min(1, 'La cédula profesional es requerida')
    .max(50),

  specialty: z
    .array(z.string())
    .min(1, 'Agrega al menos una especialidad'),

  consultation_fee: z
    .number({ invalid_type_error: 'Ingresa un número válido' })
    .positive('La tarifa debe ser mayor a 0')
    .optional(),

  years_experience: z
    .number({ invalid_type_error: 'Ingresa un número válido' })
    .int('Debe ser un número entero')
    .min(0)
    .max(60)
    .optional(),

  // full_name y phone vienen de profiles — los editamos también
  full_name: z
    .string()
    .min(2, 'El nombre es requerido')
    .max(100),

  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{8,15}$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
})

export type VetProfileFormData = z.infer<typeof vetProfileSchema>