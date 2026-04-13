// src/lib/email/templates.ts
// Templates de email como funciones que retornan HTML string.
// Diseño simple y limpio — compatible con la mayoría de clientes de email.


import { CLINIC_NAME } from './client'

interface BaseEmailData {
    clientName: string
    petName: string
    vetName: string
    date: string
    time: string
    services: string[]
    total: number
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; color: #1a1a1a; }
  .container { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .header { background: #18181b; padding: 24px 32px; }
  .header h1 { color: #ffffff; font-size: 20px; font-weight: 600; margin: 0; }
  .header p { color: #a1a1aa; font-size: 13px; margin: 4px 0 0; }
  .body { padding: 32px; }
  .greeting { font-size: 16px; font-weight: 500; margin-bottom: 8px; }
  .text { font-size: 14px; color: #52525b; line-height: 1.6; margin-bottom: 16px; }
  .card { background: #f4f4f5; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
  .card-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; font-size: 14px; }
  .card-row:last-child { margin-bottom: 0; }
  .card-label { color: #71717a; }
  .card-value { font-weight: 500; text-align: right; }
  .divider { border: none; border-top: 1px solid #e4e4e7; margin: 16px 0; }
  .total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 600; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .footer { padding: 20px 32px; border-top: 1px solid #f4f4f5; }
  .footer p { font-size: 12px; color: #a1a1aa; margin: 0; line-height: 1.6; }
`

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
  `.trim()
}

export function appointmentConfirmedEmail(data: BaseEmailData): {
    subject:string
    html: string
} {
    const servicesList = data.services.map((s) => `<li style="margin-bottom:4px">${s}</li>`).join('')
    return {
        subject: `✅ Cita confirmada — ${data.date}`,
        html: baseTemplate(`
        <div class="header">
            <h1>${CLINIC_NAME}</h1>
            <p>Confirmación de cita</p>
        </div>
    
        <div class="body">
            <p class="greeting">Hola, ${data.clientName} 👋</p>
            <p class="text">
            Tu cita ha sido <strong>confirmada</strong> por el Dr. ${data.vetName}.
            Te esperamos el día indicado.
            </p>
    
            <div class="card">
            <div class="card-row">
                <span class="card-label">Mascota</span>
                <span class="card-value">${data.petName}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Veterinario</span>
                <span class="card-value">Dr. ${data.vetName}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Fecha</span>
                <span class="card-value">${data.date}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Hora</span>
                <span class="card-value">${data.time}</span>
            </div>
            <hr class="divider">
            <div class="card-row">
                <span class="card-label">Servicios</span>
                <span class="card-value">
                <ul style="margin:0;padding:0;list-style:none;text-align:right">
                    ${servicesList}
                </ul>
                </span>
            </div>
            <hr class="divider">
            <div class="total-row">
                <span>Total estimado</span>
                <span>$${data.total.toFixed(2)} MXN</span>
            </div>
            </div>
    
            <p class="text">
            Si necesitas cancelar o modificar tu cita, contáctanos con anticipación.
            </p>
    
            <span class="badge badge-green">Cita confirmada ✓</span>
        </div>
    
        <div class="footer">
            <p>${CLINIC_NAME} · Este es un mensaje automático, por favor no respondas a este correo.</p>
        </div>
        `),
    }
}


export function appointmentCancelledEmail(data: BaseEmailData & {
    cancelledBy: 'cliente' | 'veterinario' | 'admin'
    recipientName: string
}): {
    subject: string
    html: string
} {
    const byLabel = {
        cliente: 'el cliente'.at,
        veterinario:  `el Dr. ${data.vetName}`,
        admin:        'la clínica',
    }[data.cancelledBy]
return {
    subject: `❌ Cita cancelada — ${data.date}`,
    html: baseTemplate(`
      <div class="header">
        <h1>${CLINIC_NAME}</h1>
        <p>Cancelación de cita</p>
      </div>
 
      <div class="body">
        <p class="greeting">Hola, ${data.recipientName}</p>
        <p class="text">
          La cita del día <strong>${data.date}</strong> a las <strong>${data.time}</strong>
          para <strong>${data.petName}</strong> ha sido cancelada por ${byLabel}.
        </p>
 
        <div class="card">
          <div class="card-row">
            <span class="card-label">Mascota</span>
            <span class="card-value">${data.petName}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Veterinario</span>
            <span class="card-value">Dr. ${data.vetName}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Fecha cancelada</span>
            <span class="card-value">${data.date} · ${data.time}</span>
          </div>
        </div>
 
        <p class="text">
          Puedes agendar una nueva cita cuando lo necesites.
        </p>
 
        <span class="badge badge-red">Cita cancelada</span>
      </div>
 
      <div class="footer">
        <p>${CLINIC_NAME} · Este es un mensaje automático, por favor no respondas a este correo.</p>
      </div>
    `),
  }
}