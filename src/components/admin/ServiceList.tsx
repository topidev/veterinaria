// src/components/admin/ServiceList.tsx
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Clock, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

import { ServiceForm } from './ServiceForm'
import { toggleServiceActive } from '@/lib/actions/admin/services'
import type { Service } from '@/types/supabase'

const CATEGORY_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  vacuna:   'Vacuna',
  grooming: 'Grooming',
  cirugia:  'Cirugía',
  otro:     'Otro',
}

const CATEGORY_COLORS: Record<string, string> = {
  consulta: 'text-blue-600 border-blue-300 dark:text-blue-400',
  vacuna:   'text-green-600 border-green-300 dark:text-green-400',
  grooming: 'text-pink-600 border-pink-300 dark:text-pink-400',
  cirugia:  'text-red-600 border-red-300 dark:text-red-400',
  otro:     'text-gray-600 border-gray-300',
}

interface ServiceListProps {
  services: Service[]
}

export function ServiceList({ services }: ServiceListProps) {
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (service: Service) => {
    startTransition(async () => {
      const result = await toggleServiceActive(service.id, !service.is_active)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(
        service.is_active
          ? `${service.name} desactivado`
          : `${service.name} activado`
      )
    })
  }

  // Agrupar por categoría para mejor legibilidad
  const grouped = services.reduce((acc, s) => {
    const cat = s.category ?? 'otro'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <>
      {/* Header con botón crear */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo servicio
        </Button>
      </div>

      {/* Tabla agrupada por categoría */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              {CATEGORY_LABELS[category] ?? category}
            </h3>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Servicio</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">
                      <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Duración</div>
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">
                      <div className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />Precio</div>
                    </th>
                    <th className="text-center font-medium text-muted-foreground px-4 py-2.5">Activo</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((service) => (
                    <tr
                      key={service.id}
                      className={`hover:bg-muted/30 transition-colors ${!service.is_active ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {service.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {service.duration_minutes} min
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ${Number(service.base_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={service.is_active}
                          disabled={isPending}
                          onCheckedChange={() => handleToggle(service)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingService(service)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Modal crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo servicio</DialogTitle>
            <DialogDescription>
              Agrega un servicio al catálogo de la clínica
            </DialogDescription>
          </DialogHeader>
          <ServiceForm onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal editar */}
      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar servicio</DialogTitle>
            <DialogDescription>
              Modifica los datos del servicio
            </DialogDescription>
          </DialogHeader>
          {editingService && (
            <ServiceForm
              service={editingService}
              onSuccess={() => setEditingService(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}