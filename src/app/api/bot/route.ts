// // src/app/api/bot/route.ts
// import { createClient } from '@/lib/supabase/server'
// import { buildBotContext } from '@/lib/bot/context'
// import { getAvailableSlots, createAppointment } from '@/lib/actions/reservaciones'
// import Anthropic from '@anthropic-ai/sdk'
// import { NextResponse } from 'next/server'

// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY!,
// })

// // Herramientas que Claude puede usar
// const tools: Anthropic.Tool[] = [
//   {
//     name: 'get_available_slots',
//     description: 'Obtiene los horarios disponibles de un veterinario en una fecha específica. Úsala antes de confirmar una cita para verificar disponibilidad.',
//     input_schema: {
//       type: 'object' as const,
//       properties: {
//         vet_id: {
//           type: 'string',
//           description: 'ID del veterinario',
//         },
//         date: {
//           type: 'string',
//           description: 'Fecha en formato YYYY-MM-DD',
//         },
//       },
//       required: ['vet_id', 'date'],
//     },
//   },
//   {
//     name: 'create_appointment',
//     description: 'Agenda una cita. Úsala SOLO cuando el cliente haya confirmado explícitamente todos los detalles: veterinario, mascota, fecha, hora y servicio.',
//     input_schema: {
//       type: 'object' as const,
//       properties: {
//         vet_id: {
//           type: 'string',
//           description: 'ID del veterinario',
//         },
//         pet_id: {
//           type: 'string',
//           description: 'ID de la mascota',
//         },
//         scheduled_date: {
//           type: 'string',
//           description: 'Fecha en formato YYYY-MM-DD',
//         },
//         scheduled_time: {
//           type: 'string',
//           description: 'Hora en formato HH:MM',
//         },
//         service_ids: {
//           type: 'array',
//           items: { type: 'string' },
//           description: 'Array de IDs de servicios',
//         },
//         notes: {
//           type: 'string',
//           description: 'Notas adicionales del cliente (opcional)',
//         },
//       },
//       required: ['vet_id', 'pet_id', 'scheduled_date', 'scheduled_time', 'service_ids'],
//     },
//   },
// ]

// export async function POST(request: Request) {
//   console.log('[Bot] Request recibido')
//   try {
//     const supabase = await createClient()
//     const { data: { user } } = await supabase.auth.getUser()
//     console.log('[Bot] Usuario:', user?.id ?? 'null')
//     if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

//     const { messages } = await request.json()
//     console.log('[Bot] Mensajes:', messages.length)

//     const systemPrompt = await buildBotContext(user.id)
//     console.log('[Bot] Context construido, llamando a Anthropic...')

//     // Llamar a Claude con streaming
//     const stream = new ReadableStream({
//       async start(controller) {
//         try {
//           let currentMessages = [...messages]

//           // Loop para manejar tool use — Claude puede llamar múltiples tools
//           while (true) {
//             const response = await anthropic.messages.create({
//               model:      'claude-haiku-4-5-20251001',
//               max_tokens: 1024,
//               system:     systemPrompt,
//               tools,
//               messages:   currentMessages,
//             })

//             // Procesar la respuesta
//             for (const block of response.content) {
//               if (block.type === 'text') {
//                 // Enviar texto al cliente
//                 controller.enqueue(
//                   new TextEncoder().encode(
//                     `data: ${JSON.stringify({ type: 'text', text: block.text })}

// `
//                   )
//                 )
//               }

//               if (block.type === 'tool_use') {
//                 // Claude quiere usar una herramienta
//                 let toolResult: string

//                 try {
//                   if (block.name === 'get_available_slots') {
//                     const input = block.input as { vet_id: string; date: string }
//                     const { slots, error } = await getAvailableSlots(input.vet_id, input.date)
//                     toolResult = error
//                       ? `Error: ${error}`
//                       : slots.length === 0
//                       ? 'No hay horarios disponibles para esa fecha'
//                       : `Horarios disponibles: ${slots.join(', ')}`
//                   } else if (block.name === 'create_appointment') {
//                     const input = block.input as {
//                       vet_id: string
//                       pet_id: string
//                       scheduled_date: string
//                       scheduled_time: string
//                       service_ids: string[]
//                       notes?: string
//                     }
//                     const result = await createAppointment({
//                       vet_id:         input.vet_id,
//                       pet_id:         input.pet_id,
//                       scheduled_date: input.scheduled_date,
//                       scheduled_time: input.scheduled_time,
//                       service_ids:    input.service_ids,
//                       notes:          input.notes,
//                     })
//                     toolResult = 'error' in result
//                       ? `Error al agendar: ${result.error}`
//                       : 'Cita agendada exitosamente'
//                   } else {
//                     toolResult = 'Herramienta no reconocida'
//                   }
//                 } catch (e) {
//                   toolResult = 'Error al ejecutar la acción'
//                 }

//                 // Agregar resultado de la tool al historial
//                 currentMessages = [
//                   ...currentMessages,
//                   { role: 'assistant', content: response.content },
//                   {
//                     role: 'user',
//                     content: [{
//                       type:        'tool_result',
//                       tool_use_id: block.id,
//                       content:     toolResult,
//                     }],
//                   },
//                 ]
//               }
//             }

//             // Si Claude terminó o no usó tools, salir del loop
//             if (
//               response.stop_reason === 'end_turn' ||
//               !response.content.some((b) => b.type === 'tool_use')
//             ) {
//               break
//             }
//           }

//           controller.enqueue(
//             new TextEncoder().encode('data: [DONE]')
//           )
//           controller.close()
//         } catch (err) {
//           console.log(err)
//           controller.enqueue(
//             new TextEncoder().encode(
//               `data: ${JSON.stringify({ type: 'error', text: 'Error al procesar tu mensaje' })}`
//             )
//           )
//           controller.close()
//         }
//       },
//     })

//     return new Response(stream, {
//       headers: {
//         'Content-Type':  'text/event-stream',
//         'Cache-Control': 'no-cache',
//         'Connection':    'keep-alive',
//       },
//     })
//   } catch (err) {
//     return NextResponse.json({ error: 'Error interno' }, { status: 500 })
//   }
// }

// src/app/api/bot/route.ts
import { createClient } from '@/lib/supabase/server'
import { buildBotContext } from '@/lib/bot/context'
import { getAvailableSlots, createAppointment } from '@/lib/actions/reservaciones'
import { GoogleGenerativeAI, type Tool, type FunctionDeclaration } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const API_KEY: string = process.env.GEMINI_API_KEY!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

async function listAvailableModels(): Promise<void> {
  try {
    // Accedemos a la administración de modelos
    const client = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
    
    // Nota: El SDK de JS a veces requiere usar el cliente base para listar
    // Usamos el método listModels directamente desde el objeto genAI si está disponible
    // o a través de una petición directa si el SDK tiene limitaciones.
    
    // En las versiones actuales, se hace así:
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();

    console.log("--- Modelos Disponibles ---");
    data.models.forEach((m: any) => {
      console.log(`Nombre: ${m.name}`);
      console.log(`Capacidades: ${m.supportedGenerationMethods.join(", ")}`);
      console.log("---------------------------");
    });

  } catch (error) {
    console.error("Error al listar los modelos:", error);
  }
}


// Tools en formato de Gemini (FunctionDeclaration)
const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_available_slots',
        description: 'Obtiene los horarios disponibles de un veterinario en una fecha específica. Úsala antes de confirmar una cita para verificar disponibilidad.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            vet_id: {
              type: 'STRING' as any,
              description: 'ID del veterinario',
            },
            date: {
              type: 'STRING' as any,
              description: 'Fecha en formato YYYY-MM-DD',
            },
          },
          required: ['vet_id', 'date'],
        },
      },
      {
        name: 'create_appointment',
        description: 'Agenda una cita. Úsala SOLO cuando el cliente haya confirmado explícitamente todos los detalles.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            vet_id:          { type: 'STRING' as any, description: 'ID del veterinario' },
            pet_id:          { type: 'STRING' as any, description: 'ID de la mascota' },
            scheduled_date:  { type: 'STRING' as any, description: 'Fecha YYYY-MM-DD' },
            scheduled_time:  { type: 'STRING' as any, description: 'Hora HH:MM' },
            service_ids: {
              type: 'ARRAY' as any,
              items: { type: 'STRING' as any },
              description: 'IDs de servicios',
            },
            notes: { type: 'STRING' as any, description: 'Notas opcionales' },
          },
          required: ['vet_id', 'pet_id', 'scheduled_date', 'scheduled_time', 'service_ids'],
        },
      },
    ] as FunctionDeclaration[],
  },
]

export async function POST(request: Request) {
  console.log('[Bot] Request recibido')
  // listAvailableModels();
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[Bot] Usuario:', user?.id ?? 'null')
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { messages } = await request.json()
    console.log('[Bot] Mensajes:', messages.length)

    const systemPrompt = await buildBotContext(user.id)
    console.log('[Bot] Context construido, llamando a Gemini...')

    const stream = new ReadableStream({
      async start(controller) {
        const encode = (data: object) =>
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
          )

        try {
          const model = genAI.getGenerativeModel({
            model:          'gemini-flash-lite-latest',
            systemInstruction: systemPrompt,
            tools,
          })

          // Convertir historial al formato de Gemini
          // Gemini usa 'model' en lugar de 'assistant'
          const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
            role:  m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }))

          const chat = model.startChat({ history })

          // Último mensaje del usuario
          const lastMessage = messages[messages.length - 1].content

          // Loop para manejar tool use
          let response = await chat.sendMessage(lastMessage)

          let toolCallsCount = 0;
          const MAX_TOOL_CALLS = 5;
          while (toolCallsCount < MAX_TOOL_CALLS) {
            const candidate = response.response.candidates?.[0]
            if (!candidate) break

            const parts = candidate.content.parts
            let hasToolCall = false

            for (const part of parts) {
              // Texto normal — enviarlo al cliente
              if (part.text) {
                encode({ type: 'text', text: part.text })
              }

              // Tool call — ejecutar la función
              if (part.functionCall) {
                toolCallsCount++;
                hasToolCall = true
                const { name, args } = part.functionCall
                let toolResult = ''

                try {
                  if (name === 'get_available_slots') {
                    const { vet_id, date } = args as { vet_id: string; date: string }
                    const { slots, error } = await getAvailableSlots(vet_id, date)
                    toolResult = error
                      ? `Error: ${error}`
                      : slots.length === 0
                      ? 'No hay horarios disponibles para esa fecha'
                      : `Horarios disponibles: ${slots.join(', ')}`
                  } else if (name === 'create_appointment') {
                    const input = args as {
                      vet_id:         string
                      pet_id:         string
                      scheduled_date: string
                      scheduled_time: string
                      service_ids:    string[]
                      notes?:         string
                    }
                    const result = await createAppointment({
                      vet_id:         input.vet_id,
                      pet_id:         input.pet_id,
                      scheduled_date: input.scheduled_date,
                      scheduled_time: input.scheduled_time,
                      service_ids:    input.service_ids,
                      notes:          input.notes,
                    })
                    toolResult = 'error' in result
                      ? `Error al agendar: ${result.error}`
                      : 'Cita agendada exitosamente'
                  }
                } catch {
                  toolResult = 'Error al ejecutar la acción'
                }

                // Enviar resultado de la tool a Gemini para que continúe
                response = await chat.sendMessage([{
                  functionResponse: {
                    name,
                    response: { result: toolResult },
                  },
                }])
              }
            }

            // Si no hubo tool calls, Gemini terminó
            if (!hasToolCall) break
          }

          controller.enqueue(
            new TextEncoder().encode('data: [DONE]\n\n')
          )
          controller.close()
        } catch (err) {
          console.error('[Bot] Error en stream:', err)
          encode({ type: 'error', text: 'Error al procesar tu mensaje' })
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  } catch (err) {
    console.error('[Bot] Error general:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}