// src/lib/validations/auth.ts
//
// PARA QUÉ SIRVE:
// Schemas de Zod para validar los formularios de autenticación.
// Se usan en DOS lugares:
//   1. Client Component — con @hookform/resolvers para validación en tiempo real
//   2. Server Action   — para re-validar en el servidor (nunca confíes solo en el cliente)
//
// ZOD v4 — NOTA IMPORTANTE PARA EL PROYECTO:
// Tienes zod ^4.3.6 instalado. En Zod v4 el import estándar sigue siendo:
//   import { z } from 'zod'
// El import 'zod/v4' solo existe si tienes instalada una versión bridge (zod@3.x con compat).
// Con zod ^4.x puro, usa siempre: import { z } from 'zod'
//
// @hookform/resolvers@5.x ya soporta Zod v4 nativamente con zodResolver.

import { z } from 'zod'

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Ingresa un correo válido'),

  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// ─── Registro ─────────────────────────────────────────────────────────────────
//
// Nota para Junior: usamos z.infer<typeof schema> para generar el tipo TypeScript
// automáticamente desde el schema. No necesitas definir la interfaz por separado.
// Si cambias el schema, el tipo se actualiza solo.

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre es demasiado largo'),

    email: z
      .string()
      .min(1, 'El correo es requerido')
      .email('Ingresa un correo válido'),

    phone: z
      .string()
      .regex(
        /^\+?[\d\s\-()]{8,15}$/,
        'Ingresa un teléfono válido (ej: +52 55 1234 5678)'
      )
      .optional()
      .or(z.literal('')),

    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),

    confirm_password: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirm_password, {
    // refine() permite validaciones que cruzan múltiples campos
    // Aquí verificamos que las dos contraseñas coincidan
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'], // El error aparece en el campo confirm_password
  })

export type RegisterFormData = z.infer<typeof registerSchema>

// ─── Recuperación de contraseña ────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Ingresa un correo válido'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// ─── Nueva contraseña (después del link de recuperación) ──────────────────────

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),

    confirm_password: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>