// src/lib/email/send.ts
// Helper central para enviar emails — todos los envíos pasan por aquí.
// Si cambiamos de Resend a otro proveedor, solo tocamos este archivo. 

import { error } from 'console'
import { resend, FROM_EMAIL, CLINIC_NAME } from './client'

interface SendEmailOptions {
    to: string | string[]
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
    try {
        const { error } = await resend.emails.send({
            from: `${CLINIC_NAME} <${FROM_EMAIL}>`,
            to: Array.isArray(to) ? to : [to],
            subject,
            html
        })
        if (error) {
            console.error('[sendEmail] Error al enviar email:', error)
        }
    } catch (err) {
         // Capturamos cualquier error de red — igual, no interrumpimos el flujo
        console.error('[sendEmail] Error inesperado:', err)
    }
}