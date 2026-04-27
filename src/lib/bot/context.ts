// src/lib/bot/context.ts
// Construye el system prompt del bot con datos reales de Supabase.
// Se llama en cada request — así el bot siempre tiene info actualizada.

import { createClient } from '@/lib/supabase/server'

export async function buildBotContext(userId: string): Promise<string> {
  const supabase = await createClient()

  // Leer datos en paralelo
  const [
    { data: profile },
    { data: pets },
    { data: vets },
    { data: services },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single(),

    supabase
      .from('pets')
      .select('id, name, species, breed')
      .eq('owner_id', userId)
      .eq('is_active', true),

    supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        veterinario_profiles (
          specialty,
          consultation_fee,
          bio
        ),
        vet_schedules (
          day_of_week,
          start_time,
          end_time,
          slot_duration
        )
      `)
      .eq('role', 'veterinario')
      .eq('is_active', true),

    supabase
      .from('services')
      .select('id, name, base_price, duration_minutes, category')
      .eq('is_active', true)
      .order('category'),
  ])

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  const vetsInfo = (vets ?? [])
    .filter((v) => v.vet_schedules && v.vet_schedules.length > 0)
    .map((v) => {
      const vp = v.veterinario_profiles as any
      const schedules = (v.vet_schedules as any[])
        .sort((a, b) => a.day_of_week - b.day_of_week)
        .map((s) => `${DIAS[s.day_of_week]} ${s.start_time.slice(0,5)}-${s.end_time.slice(0,5)}`)
        .join(', ')

    return `- ${v.full_name} (ID: ${v.id})
        Especialidad: ${vp?.specialty?.join(', ') ?? 'Medicina general'}
        Tarifa: $${vp?.consultation_fee ?? '—'} MXN
        Horario: ${schedules}`
    }).join('')

  const servicesInfo = (services ?? [])
    .map((s) => `- ${s.name} (ID: ${s.id}): $${s.base_price} MXN, ${s.duration_minutes} min`)
    .join('')

  const petsInfo = (pets ?? [])
    .map((p) => `- ${p.name} (ID: ${p.id}): ${p.species}${p.breed ? `, ${p.breed}` : ''}`)
    .join('')

  return `Eres el asistente virtual de PetCare, una clínica veterinaria.
Tu objetivo es ayudar a los clientes a agendar citas y responder preguntas sobre los servicios.

HOY ES: ${today}

CLIENTE:
Nombre: ${profile?.full_name ?? 'Cliente'}
ID: ${userId}

MASCOTAS DEL CLIENTE:
${petsInfo || 'No tiene mascotas registradas'}

VETERINARIOS DISPONIBLES:
${vetsInfo || 'No hay veterinarios disponibles'}

CATÁLOGO DE SERVICIOS:
${servicesInfo || 'No hay servicios disponibles'}

INSTRUCCIONES:
- Saluda al cliente por su nombre al inicio de la conversación
- Para agendar, necesitas: veterinario, mascota, fecha, hora y al menos un servicio
- Usa get_available_slots para verificar disponibilidad antes de confirmar una hora
- Usa create_appointment solo cuando el cliente confirme explícitamente
- Si el cliente no tiene mascotas, dile que primero debe registrar una desde su perfil
- Responde siempre en español, de forma amable y concisa
- Para preguntas de precios o servicios, usa la información de arriba
- No inventes información que no esté en el contexto
- Si no puedes ayudar con algo, sugiere contactar a la clínica directamente`
}