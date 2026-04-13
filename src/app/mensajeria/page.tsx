// src/app/mensajeria/page.tsx
import { MessageSquare } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mensajes' }

export default function MensajeriaPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <h2 className="font-medium">Selecciona una conversación</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Elige una conversación del panel izquierdo para ver los mensajes
      </p>
    </div>
  )
}