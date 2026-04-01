// src/components/reservaciones/StepSlot.tsx
'use client'

import { useEffect, useState } from 'react'
import { getAvailableSlots } from '@/lib/actions/reservaciones'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock } from 'lucide-react'

interface StepSlotProps {
  vetId: string
  date: string
  selectedTime?: string
  onSelect: (time: string) => void
}

export function StepSlot({ vetId, date, selectedTime, onSelect }: StepSlotProps) {
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    getAvailableSlots(vetId, date).then(({ slots, error }) => {
      if (error) setError(error)
      setSlots(slots)
      setLoading(false)
    })
  }, [vetId, date])

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Cargando horarios disponibles...</p>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="font-medium">{error}</p>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="font-medium">Sin horarios disponibles</p>
        <p className="text-sm text-muted-foreground mt-1">
          Todos los horarios de ese día están ocupados. Elige otra fecha.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {slots.length} horario{slots.length !== 1 ? 's' : ''} disponible{slots.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {slots.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            className={`
              py-2.5 rounded-lg text-sm font-medium border transition-colors
              ${selectedTime === slot
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:border-primary hover:text-primary'
              }
            `}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  )
}