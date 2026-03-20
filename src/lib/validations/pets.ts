// src/lib/validations/pets.ts
import { z } from 'zod'
import { Constants } from '@/types/supabase'

export const addPetSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'Máximo 50 caracteres'),

  species: z.enum(
    Constants.public.Enums.pet_species as unknown as [string, ...string[]],
    { error: 'Selecciona una especie' }
  ),

  breed: z.string().max(50).optional().or(z.literal('')),

  date_of_birth: z.string().optional().or(z.literal('')),

  weight_kg: z
    .number({ invalid_type_error: 'Ingresa un número válido' })
    .positive('El peso debe ser mayor a 0')
    .optional(),

  sex: z.enum(['male', 'female']).optional(),

  is_neutered: z.boolean().default(false),

  medical_notes: z.string().max(500).optional().or(z.literal('')),
})

export type AddPetFormData = z.infer<typeof addPetSchema>