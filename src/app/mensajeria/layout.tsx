// src/app/mensajeria/layout.tsx

import { ConversationList } from "@/components/mensajeria/ConversationList";
import { NewConversationButton } from "@/components/mensajeria/NewConversationButton";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/supabase";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
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

  const dashboardHref = `/dashboard/${role}`

  return (
    <div className="flex h-screen">
 
      {/* Sidebar — en mobile ocupa todo el ancho */}
      <div className="w-full md:w-80 md:shrink-0 border-r flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Link
            href={dashboardHref}
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h2 className="font-semibold text-sm flex-1">Mensajes</h2>
          {role === 'cliente' && <NewConversationButton />}
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList conversations={convsWithUnread}/>
        </div>
      </div>
 
      {/* Chat — en mobile solo visible cuando hay conversación */}
      <div className="hidden md:flex flex-1 min-w-0 flex-col">
        {children}
      </div>
 
    </div>
  )

}