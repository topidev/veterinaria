// src/lib/email/client.ts
// La instancia de Resend vive aquí — se importa en cualquier Server Action.
// NUNCA importes esto en un Client Component ('use client').
// RESEND_API_KEY no tiene prefijo NEXT_PUBLIC_ por esa razón.

import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

// El email desde el que se envía todo.
// En desarrollo puedes usar onboarding@resend.dev (no requiere dominio verificado).
// En producción cambia por tu dominio: notificaciones@tudominio.com
export const FROM_EMAIL = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
export const CLINIC_NAME = 'PetCare'