// src/components/reservaciones/StepServicios.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import type { Service } from '@/types/supabase'

const CATEGORY_LABELS: Record<string, string> = {
  consulta: 'Consulta', vacuna: 'Vacuna', grooming: 'Grooming',
  cirugia: 'Cirugía', otro: 'Otro',
}

interface StepServiciosProps {
  services: Service[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function StepServicios({ services, selectedIds, onChange }: StepServiciosProps) {
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]
    )
  }

  const selectedServices = services.filter((s) => selectedIds.includes(s.id))
  const total = selectedServices.reduce((sum, s) => sum + Number(s.base_price), 0)

  // Agrupar por categoría
  const grouped = services.reduce((acc, s) => {
    if (!s.is_active) return acc
    const cat = s.category ?? 'otro'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selecciona los servicios que necesitas (puedes elegir varios)
      </p>

      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {CATEGORY_LABELS[category] ?? category}
            </p>
            <div className="space-y-2">
              {items.map((service) => {
                const isSelected = selectedIds.includes(service.id)
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggle(service.id)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors
                      ${isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                      }
                    `}
                  >
                    <div className={`
                      shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors
                      ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}
                    `}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">${Number(service.base_price).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">{service.duration_minutes} min</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} servicio{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}
          </p>
          <p className="font-semibold">Total: ${total.toFixed(2)} MXN</p>
        </div>
      )}
    </div>
  )
}