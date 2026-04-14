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
import { CheckCheck, ChevronLeft, Send } from "lucide-react"
import { Badge } from "../ui/badge"
import Link from "next/link"
import { Textarea } from "../ui/textarea"

const STATUS_CONFIG = {
  open:        { label: 'Sin atender', color: 'text-amber-600 border-amber-300' },
  in_progress: { label: 'En progreso', color: 'text-blue-600 border-blue-300' },
  resolved:    { label: 'Resuelto',    color: 'text-green-600 border-green-300' },
}

interface ChatWindowProps {
  conversation: Conversation & {
    vet_name?: string | null 
  }
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
  const supabase = createClient()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [messages, setMessages] = useState<Message[]>(initialMessages)

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

    const supabase = createClient()

    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   if (!session) return

      const channel = supabase
        .channel(`conversations:${conversation.id}`, {
          config: {
            broadcast: { self: true },
          }
        })
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
              if (prev.some((m) => m.id === newMessage.id)) return prev
              return [...prev, newMessage]
            })

            // Si no es nuestro message, marcar ocmo leído
            if (newMessage.sender_id !== currentUserId) {
              markMessageAsRead(conversation.id)
            }
          }
        )
        .subscribe((status, err) => {
          console.log('[Realtime] status:', status, err ?? '')
        })
      return () => {
        supabase.removeChannel(channel)
      }
    // })
  }, [conversation.id, currentUserId])
    

  const handleSend = async () => {
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')

    const result = await sendMessage(conversation.id, content)
    setSending(false)

    if ('error' in result) {
      // Revertir el optimistic update si falla
      toast.error(result.error)
      setInput(content)
    }
      // Realtime se encarga de agregar el mensaje — sin optimistic update
      // para evitar duplicados
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
      toast.success('Conversacion resuelta')
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

  const config = STATUS_CONFIG[conversation.status]

  return (
    <div className="flex flex-col h-full">
 
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0">
        <Link
          href="/mensajeria"
          className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
 
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{conversation.subject}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className={`text-xs ${config.color}`}>
              {config.label}
            </Badge>
            {conversation.vet_name && (
              <span className="text-xs text-muted-foreground">
                · Dr. {conversation.vet_name}
              </span>
            )}
            {isOpen && !conversation.vet_id && (
              <span className="text-xs text-muted-foreground">
                · Esperando veterinario...
              </span>
            )}
          </div>
        </div>
 
        <div className="flex items-center gap-2 flex-shrink-0">
          {isOpen && currentRole === 'veterinario' && (
            <Button size="sm" onClick={handleTakeTicket} disabled={isPending}>
              Tomar ticket
            </Button>
          )}
          {!isResolved && (conversation.vet_id === currentUserId || currentRole === 'admin') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolve}
              disabled={isPending}
              className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Resolver</span>
            </Button>
          )}
        </div>
      </div>
 
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Sin mensajes. Escribe el primero.</p>
          </div>
        )}
 
        {messages.map((message, i) => {
          const isOwn     = message.sender_id === currentUserId
          const showRole  = !isOwn && (i === 0 || messages[i - 1].sender_id !== message.sender_id)
          const showTime  = i === messages.length - 1 || messages[i + 1]?.sender_id !== message.sender_id
 
          return (
            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {showRole && (
                  <span className="text-xs text-muted-foreground px-1 mb-0.5 capitalize">
                    {message.sender_role === 'veterinario' ? 'Veterinario' :
                     message.sender_role === 'admin' ? 'Admin' : 'Cliente'}
                  </span>
                )}
                <div className={`
                  rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                  ${isOwn
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-secondary text-foreground rounded-tl-sm'
                  }
                `}>
                  {message.content}
                </div>
                {showTime && (
                  <span className="text-xs text-muted-foreground px-1 mt-0.5">
                    {new Date(message.created_at).toLocaleTimeString('es-MX', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
 
      {/* Input */}
      {canSend ? (
        <div className="flex gap-2 px-4 py-3 border-t flex-shrink-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            disabled={sending || isPending}
            rows={1}
            className="resize-none min-h-[40px] max-h-32"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            size="icon"
            className="flex-shrink-0 self-end"
            onClick={handleSend}
            disabled={sending || isPending || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t flex-shrink-0 text-center">
          <p className="text-xs text-muted-foreground">
            {isResolved ? 'Esta conversación está resuelta' : 'Sin permisos para enviar mensajes'}
          </p>
        </div>
      )}
    </div>
  )
}