// src/lib/validations/pets.ts
import { z } from 'zod'
import { Constants } from '@/types/supabase'

// ─── Schema existente — agregar mascota ───────────────────────────────────────

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
    .number({ message: 'Ingresa un número válido' })
    .positive('El peso debe ser mayor a 0')
    .optional(),

  sex: z.enum(['male', 'female']).optional(),
  is_neutered: z.boolean().default(false),
  medical_notes: z.string().max(500).optional().or(z.literal('')),
})

export type AddPetFormData = z.infer<typeof addPetSchema>

// ─── Schema nuevo — editar datos básicos de la mascota ────────────────────────

export const petProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'Máximo 50 caracteres'),

  breed: z
    .string()
    .max(50, 'Máximo 50 caracteres')
    .optional()
    .or(z.literal('')),

  date_of_birth: z
    .string()
    .optional()
    .or(z.literal('')),
})

export type PetProfileFormData = z.infer<typeof petProfileSchema>

// ─── Schema nuevo — historial clínico ────────────────────────────────────────

export const medicalRecordSchema = z.object({
  pet_id: z.string().uuid(),

  type: z.enum(
    ['vacuna', 'desparasitacion', 'cirugia', 'consulta', 'otro'],
    { error: 'Selecciona un tipo' }
  ),

  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(100),

  description: z
    .string()
    .max(500)
    .optional()
    .or(z.literal('')),

  date: z.string().min(1, 'La fecha es requerida'),

  next_due_date: z
    .string()
    .optional()
    .or(z.literal('')),

  appointment_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal('')),

  // Peso al momento del registro — solo para consultas
  weight_kg: z
    .number({ message: 'Ingresa un número válido' })
    .positive('El peso debe ser mayor a 0')
    .optional(),
})

export type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>