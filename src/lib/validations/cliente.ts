// src/lib/validations/cliente.ts
import { z } from 'zod'

export const clienteProfileSchema = z.object({
  // Datos base de profiles
  full_name: z
    .string()
    .min(2, 'El nombre es requerido')
    .max(100),

  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{8,15}$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),

  // Datos de cliente_profiles
  address: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),

  // Contacto de emergencia como campos separados
  // Los combinamos en un objeto jsonb antes de guardar
  emergency_name: z
    .string()
    .max(100)
    .optional()
    .or(z.literal('')),

  emergency_phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{8,15}$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),

  emergency_relation: z
    .string()
    .max(50)
    .optional()
    .or(z.literal('')),
})

export type ClienteProfileFormData = z.infer<typeof clienteProfileSchema>