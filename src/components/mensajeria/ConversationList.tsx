// src/components/mensajeria/ConversationList.tsx
'use client'

import { cn } from "@/lib/utils"
import { Conversation, Message, UserRole } from "@/types/supabase"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "../ui/badge"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search } from "lucide-react"
import { Input } from "../ui/input"

const STATUS_CONFIG = {
  open: { label: 'Sin atender', color: 'text-amber-600 border-amber-300' },
  in_progress: { label: 'En progreso', color: 'text-blue-600 border-blue-300' },
  resolved: { label: 'Resuelto', color: 'text-green-600 border-green-300' },
}

type ConvWithDetails = Conversation & {
  unreadCount?: number
  vet_name?: string | null
}

interface ConversationListProps {
  conversations: ConvWithDetails[]
  currentUserId: string
  currentRole: UserRole
}

export function ConversationList({
  conversations: initialConversations,
  currentUserId,
  currentRole,
}: ConversationListProps) {
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'active' | 'resolved'>('active')
  const [conversations, setConversations] = useState(initialConversations)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('sidebar:unread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const msg = payload.new as Message

          if (msg.sender_id === currentUserId) return

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== msg.conversation_id) return c
              return { ...c, unreadCount: (c.unreadCount ?? 0) + 1 }
            })
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const updated = payload.new as Message
          if (updated.is_read && updated.sender_id !== currentUserId) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === updated.conversation_id ?
                  { ...c, unreadCount: Math.max(0, (c.unreadCount ?? 1) - 1) }
                  : c
              )
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  const activeCount = conversations.filter((c) => c.status !== 'resolved').length
  const resolvedCount = conversations.filter((c) => c.status === 'resolved').length

  const filtered = conversations.filter((c) => {
    const matchTab = tab === 'active' ? c.status !== 'resolved' : c.status === 'resolved'
    const matchSearch = c.subject.toLocaleLowerCase().includes(search.toLocaleLowerCase())
    return matchTab && matchSearch
  })

  if (initialConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <p className="text-sm font-medium">Sin conversaciones</p>
        <p className="text-xs text-muted-foreground mt-1">
          Las conversaciones aparecerán aquí
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Búsqueda */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Tabs activas / resueltas */}
      <div className="flex border-b shrink-0">
        <button
          onClick={() => setTab('active')}
          className={cn(
            'cursor-pointer flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
            tab === 'active'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Activas
          {activeCount > 0 && (
            <span className={cn(
              'h-4 min-w-4 px-1 rounded-full text-xs flex items-center justify-center',
              tab === 'active'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}>
              {activeCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('resolved')}
          className={cn(
            'cursor-pointer flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
            tab === 'resolved'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Resueltas
          {resolvedCount > 0 && (
            <span className="h-4 min-w-4 px-1 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">
              {resolvedCount}
            </span>
          )}
        </button>
      </div>

      {/* Lista — mantiene tu estructura original de Links */}
      <div className="divide-y overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {search
                ? 'Sin resultados para esa búsqueda'
                : tab === 'active'
                  ? 'Sin conversaciones activas'
                  : 'Sin conversaciones resueltas'}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = pathname === `/mensajeria/${conv.id}`
            const config = STATUS_CONFIG[conv.status]

            return (
              <Link
                key={conv.id}
                href={`/mensajeria/${conv.id}`}
                className={cn(
                  'flex flex-col gap-1 px-4 py-3 hover:bg-muted/50 transition-colors',
                  isActive && 'bg-muted'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{conv.subject}</p>
                  {conv.unreadCount && conv.unreadCount > 0 ? (
                    <span className="shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-xs ${config.color}`}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(conv.last_message_at).toLocaleDateString('es-MX', {
                      month: 'short', day: 'numeric'
                    })}
                  </span>
                </div>
              </Link>
            )
          })
        )}
      </div>

    </div>
  )
}