'use client'

import { markMessageAsRead, resolveConversation, sendMessage, takeConversation } from "@/lib/mensajeria"
import { createClient } from "@/lib/supabase/client"
import { Conversation, Message, UserRole } from "@/types/supabase"
import { error } from "console"
import { optimizeImage } from "next/dist/server/image-optimizer"
import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { CheckCheck, Send } from "lucide-react"
import { Badge } from "../ui/badge"

const ROLE_LABELS: Record<UserRole, string> = {
  cliente: 'Cliente',
  veterinario: 'Vet',
  admin: 'Admin',
}

interface ChatWindowProps {
  conversation: Conversation
  initialMessages: Message[]
  currentUserId: string
  currentRole: UserRole
}

export function ChatWindow({
  conversation,
  initialMessages,
  currentUserId,
  currentRole,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Marcar mensaje como leído justo al abrir
  useEffect(() => {
    markMessageAsRead(conversation.id)
  }, [conversation.id])

  // Ir al ultimo mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase RealTime - escuchar mensajes en la conversación
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message

          // Evitar duplicados > el sender ve su mensaje en optimistic update
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id)
            return exists ? prev : [...prev, newMessage]
          })

          // Si no es nuestro message, marcar ocmo leído
          if (newMessage.sender_id != currentUserId) {
            markMessageAsRead(conversation.id)
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, currentUserId])

  const handleSend = () => {
    const content = input.trim()
    if (!content || isPending) return

    // Optimistic Update del mensaje
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      sender_role: currentRole,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setInput('')

    startTransition(async () => {
      const result = await sendMessage(conversation.id, content)
      if ('error' in result) {
        // Revertir el optimistic update si falla
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
        toast.error(result.error)
      }
      // Si tiene éxito, Realtime reemplaza el mensaje optimista con el real
    })
  }

  const handleTakeTicket = () => {
    startTransition(async () => {
      const result = await takeConversation(conversation.id)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Ticket Tomado - Ya puedes responder')
    })
  }

  const handleResolve = () => {
    startTransition(async () => {
      const result = await resolveConversation(conversation.id)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Conversacion marcada como resuelta')
    })
  }

  const isResolved = conversation.status === 'resolved'
  const isOpen = conversation.status === 'open'
  const canSend = !isResolved && (
    conversation.client_id === currentUserId ||
    conversation.vet_id === currentUserId ||
    (isOpen && currentRole === 'veterinario') ||
    currentRole === 'admin'
  )

  return (
    <div className="flex flex-col h-full">

      {/* Header del chat */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div>
          <p className="font-medium text-sm">{conversation.subject}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              variant="outline"
              className={`text-xs ${isResolved ? 'text-green-600 border-green-300' :
                  isOpen ? 'text-amber-600 border-amber-300' :
                    'text-blue-600 border-blue-300'
                }`}
            >
              {isResolved ? 'Resuelto' : isOpen ? 'Sin atender' : 'En progreso'}
            </Badge>
          </div>
        </div>

        {/* Acciones según rol y status */}
        <div className="flex items-center gap-2">
          {isOpen && currentRole === 'veterinario' && (
            <Button size="sm" onClick={handleTakeTicket} disabled={isPending}>
              Tomar ticket
            </Button>
          )}
          {!isResolved && conversation.vet_id === currentUserId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolve}
              disabled={isPending}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Resolver
            </Button>
          )}
          {!isResolved && currentRole === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolve}
              disabled={isPending}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Resolver
            </Button>
          )}
        </div>
      </div>

      {/* Lista de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">
              Sin mensajes aún. Escribe el primero.
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isOwn = message.sender_id === currentUserId
          const isOptimistic = message.id.startsWith('optimistic-')

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Rol del sender */}
                <span className="text-xs text-muted-foreground px-1">
                  {isOwn ? 'Tú' : ROLE_LABELS[message.sender_role]}
                </span>

                {/* Burbuja del mensaje */}
                <div className={`
                  rounded-2xl px-4 py-2.5 text-sm
                  ${isOwn
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted rounded-tl-sm'
                  }
                  ${isOptimistic ? 'opacity-70' : ''}
                `}>
                  {message.content}
                </div>

                {/* Hora */}
                <span className="text-xs text-muted-foreground px-1">
                  {new Date(message.created_at).toLocaleTimeString('es-MX', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input de mensaje */}
      {canSend ? (
        <div className="flex gap-2 px-4 py-3 border-t shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isPending || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t shrink-0">
          <p className="text-xs text-center text-muted-foreground">
            {isResolved
              ? 'Esta conversación está resuelta'
              : 'No tienes permisos para enviar mensajes'}
          </p>
        </div>
      )}

    </div>
  )
}