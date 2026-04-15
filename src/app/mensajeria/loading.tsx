// src/app/mensajeria/loading.tsx
import { MessageSquare } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function MensajeriaLoading() {
  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sidebar - Lista de conversaciones (loading) */}
      <div className="w-full md:w-80 md:shrink-0 border-r flex flex-col bg-background">
        {/* Header del sidebar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <Skeleton className="h-5 w-24" />
          
          {/* Botón Nueva consulta (solo visible para clientes) */}
          <div className="ml-auto">
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
        </div>

        Lista de conversaciones falsas
        <div className="flex-1 overflow-hidden p-3 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 px-3 py-3 rounded-xl bg-muted/50">
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-45" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área del chat (loading) - Solo visible en desktop */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-background">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
          <Skeleton className="h-6 w-64 mx-auto mb-3" />
          <Skeleton className="h-4 w-80 mx-auto text-muted-foreground" />
        </div>

        {/* Simulación de chat vacío con skeletons */}
        <div className="mt-12 w-full max-w-md space-y-8 px-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${i % 2 === 0 ? 'items-end' : 'items-start'} flex flex-col`}>
                {i % 2 === 1 && <Skeleton className="h-3 w-16 mb-1" />}
                <Skeleton 
                  className={`h-10 w-55 rounded-2xl ${i % 2 === 0 ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} 
                />
                <Skeleton className="h-3 w-12 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}