// src/components/bot/BotWidget.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Role = 'user' | 'assistant'

interface Message {
  id:      string
  role:    Role
  content: string
}

const WELCOME_MESSAGE: Message = {
  id:      'welcome',
  role:    'assistant',
  content: '¡Hola! Soy el asistente virtual de PetCare 🐾 Puedo ayudarte a agendar citas o responder preguntas sobre nuestros servicios. ¿En qué te ayudo?',
}

export function BotWidget() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || loading) return

    // Generar IDs una sola vez — no usar Date.now() dentro de callbacks
    const userMessage: Message = {
      id:      `user-${crypto.randomUUID()}`,
      role:    'user',
      content,
    }

    const botId = `bot-${crypto.randomUUID()}`

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: botId, role: 'assistant', content: '' },
    ])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMessage]
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }))

      const response = await fetch('/api/bot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history }),
      })

      if (!response.ok || !response.body) throw new Error('Error en la respuesta')

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let botText   = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'text' && parsed.text) {
              botText += parsed.text
              // Usar el botId capturado arriba — siempre el mismo
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botId ? { ...m, content: botText } : m
                )
              )
            }
            if (parsed.type === 'error') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botId
                    ? { ...m, content: parsed.text || 'Ocurrió un error. Intenta de nuevo.' }
                    : m
                )
              )
            }
          } catch {
            // ignorar líneas malformadas del stream
          }
        }
      }
    } catch (err) {
      console.error('[BotWidget] Error:', err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, content: 'Ocurrió un error. Intenta de nuevo.' }
            : m
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 rounded-2xl border bg-background shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-primary text-primary-foreground shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Asistente PetCare</p>
              <p className="text-xs opacity-75">Siempre disponible</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20 shrink-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm'
                )}>
                  {message.content
                    ? message.content
                    : <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  }
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 px-3 py-3 border-t shrink-0">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={loading}
              rows={1}
              className="resize-none min-h-[36px] max-h-24 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />
            <Button
              size="icon"
              className="shrink-0 self-end h-9 w-9"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <Button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
        size="icon"
      >
        {open
          ? <X className="h-5 w-5" />
          : <MessageCircle className="h-5 w-5" />
        }
      </Button>
    </>
  )
}