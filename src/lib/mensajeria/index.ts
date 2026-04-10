'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "../supabase/server"

type ActionResult = {
  error: string
} | {
  success: true
}
type CreateResult = {
  error: string
} | {
  success: true;
  conversationId: string
}

// ----- Cliente crear la conversación/ticket -----

export async function CreateConversation(subject: string): Promise<CreateResult> {
  if (!subject.trim()) return { error: 'El asunto es requerido' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      client_id: user.id,
      subject: subject.trim()
    })
    .select('id')
    .single()

  if (error || !data) return { error: 'Error al crear la conversación' }

  revalidatePath('/mensajeria')
  return { success: true, conversationId: data.id }
}

// ---- Veterinario toma una conversación abierta -----

export async function takeConversation(conversationId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: conv } = await supabase
    .from('conversations')
    .select('status, vet_id')
    .eq('id', conversationId)
    .single()

  if (!conv) return { error: 'Conversación no encontrada' }
  if (conv.status !== 'open') return { error: 'Este ticket ya fue tomado' }

  const { error } = await supabase
    .from('conversations')
    .update({
      vet_id: user.id,
      status: 'in_progress'
    })
    .eq('id', conversationId)

  if (error) return { error: 'Error al tomar el ticket' }

  revalidatePath('/mensajeria')
  return { success: true }
}

// ----- Enviar Mensaje ------------------

export async function sendMessage(conversaciónId: string, content: string): Promise<ActionResult> {
  if (!content.trim()) return { error: 'El mensaje no puede estar vacío.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile no encontrado' }

  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversaciónId,
      sender_id: user.id,
      sender_role: profile.role,
      content: content.trim()
    })

  if (error) return { error: 'Error al evniar el mensaje.' }

  // Realtime de supabase actualiza la UI
  return { success: true }
}

export async function markMessageAsRead(conversaciónId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Marcar como leídos los mensajes que NO son del usuario actual
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversaciónId)
    .neq('sender_id', user.id)
    .eq('is_read', false)
}


export async function resolveConversation(conversationId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile no encontrado' }

  const { data: conv } = await supabase
    .from('conversations')
    .select('vet_id')
    .eq('id', conversationId)
    .single()

  if (!conv) return { error: 'Conversación no encontrada' }

  const isVet = conv.vet_id === user.id
  const isAdmin = profile.role === 'admin'

  if (!isVet && !isAdmin) {
    return { error: 'Sin permisos para cerrar la conversación.' }
  }

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'resolved' })
    .eq('id', conversationId)

  if (error) return { error: 'Error al cerrar la conversación.' }

  revalidatePath('/mensajeria')
  return { success: true }
}