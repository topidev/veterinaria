// src/app/mensajeria/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatWindow } from '@/components/mensajeria/ChatWindow'
import type { Metadata } from 'next'
import type { UserRole } from '@/types/supabase'

export const metadata: Metadata = { title: 'Conversación' }

interface ConvPageProps {
  params: Promise<{ id: string }>
}

export default async function ConversacionPage({ params }: ConvPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Leer conversación
  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      *,
      vet:profiles!conversations_vet_id_fkey ( full_name )
    `)
    .eq('id', id)
    .single()

  if (!conversation) notFound()

  // Verificar acceso
  const role = profile?.role as UserRole
  const hasAccess =
    conversation.client_id === user.id ||
    conversation.vet_id === user.id ||
    conversation.status === 'open' ||
    role === 'admin'

  if (!hasAccess) redirect('/mensajeria')

  // Leer mensajes iniciales — el resto llega por Realtime
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  const vetName = (conversation.vet as any)?.full_name ?? null

  return (
      <ChatWindow
        conversation={{ ...conversation, vet_name: vetName }}
        initialMessages={messages ?? []}
        currentUserId={user.id}
        currentRole={role}
      />
  )
}