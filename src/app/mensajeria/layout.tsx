// src/app/mensajeria/layout.tsx

import { ConversationList } from "@/components/mensajeria/ConversationList";
import { NewConversationButton } from "@/components/mensajeria/NewConversationButton";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/supabase";
import { redirect } from "next/navigation";

export default async function MensajeriaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as UserRole

  let query = supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false })

  if (role === 'cliente') {
    query = query.eq('client_id', user.id)
  } else if (role === 'veterinario') {
    query = query.or(`vet_id.eq.${user.id},status.eq.open`)
  }

  const { data: conversations } = await query

  const { data: unread } = await supabase
    .from('messages')
    .select('conversation_id')
    .eq('is_read', false)
    .neq('sender_id', user.id)

  const unreadByConv = (unread ?? []).reduce((acc, m) => {
    acc[m.conversation_id] = (acc[m.conversation_id] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const convsWithUnread = (conversations ?? []).map((c) => ({
    ...c,
    unreadCount: unreadByConv[c.id] ?? 0,
  }))

  return (
    <div className="flex h-[calc(100vh-56px)]">

      {/* Sidebar de conversaciones */}
      <div className="w-80 shrink-0 border-r flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-sm">Mensajes</h2>
          {role === 'cliente' && <NewConversationButton />}
        </div>
        <ConversationList conversations={convsWithUnread} />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

    </div>
  )

}