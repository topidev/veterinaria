// src/components/mensajeria/UnreadBadge.tsx
// Client Component que muestra y actualiza en tiempo real
// el badge de mensajes no leídos en el sidebar del dashboard
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/supabase'

interface UnreadBadgeProps {
  initialCount: number
  currentUserId: string
}

export function UnreadBadge({ initialCount, currentUserId }: UnreadBadgeProps) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('unread:badge')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message
          if (msg.sender_id !== currentUserId) {
            setCount((prev) => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message
          if (msg.is_read && msg.sender_id !== currentUserId) {
            setCount((prev) => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  if (count === 0) return null

  return (
    <span className="ml-auto h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center flex-shrink-0">
      {count > 9 ? '9+' : count}
    </span>
  )
}