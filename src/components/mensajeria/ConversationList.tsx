// src/components/mensajeria/ConversationList.tsx
'use client'

import { cn } from "@/lib/utils"
import { Conversation } from "@/types/supabase"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "../ui/badge"

const STATUS_CONFIG = {
  open: { label: 'Sin atender', color: 'text-amber-600 border-amber-300' },
  in_progress: { label: 'En progreso', color: 'text-blue-600 border-blue-300' },
  resolved: { label: 'Resuelto', color: 'text-green-600 border-green-300' },
}

interface ConversationListProps {
  conversations: (Conversation & { unreadCount?: number })[]
}

export function ConversationList({ conversations }: ConversationListProps) {
  const pathname = usePathname()

  if (conversations.length === 0) {
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
    <div className="divide-y overflow-y-auto">
      {conversations.map((conv) => {
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
                <span className="shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
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
      })}
    </div>
  )
}