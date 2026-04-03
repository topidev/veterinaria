// src/components/reservaciones/StepConfirmar.tsx
'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarDays, Clock, User, PawPrint } from 'lucide-react'
import type { Service, Pet } from '@/types/supabase'
import type { BookingState } from './BookingFlow'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

interface StepConfirmarProps {
  booking: BookingState
  services: Service[]
  pets: Pet[]
  selectedPetId?: string
  notes: string
  onPetChange: (petId: string, petName: string) => void
  onNotesChange: (notes: string) => void
}

export function StepConfirmar({
  booking, services, pets, selectedPetId, notes, onPetChange, onNotesChange
}: StepConfirmarProps) {
  const selectedServices = services.filter((s) => booking.service_ids?.includes(s.id))
  const total = selectedServices.reduce((sum, s) => sum + Number(s.base_price), 0)

  const date = new Date(booking.date + 'T12:00:00')
  const dateLabel = `${DIAS[date.getUTCDay()]} ${date.getUTCDate()} ${MESES[date.getUTCMonth()]} ${date.getUTCFullYear()}`

  return (
    <div className="space-y-4">

      {/* Resumen */}
      <div className="rounded-xl border p-4 space-y-3">
        <p className="font-medium text-sm">Resumen de tu cita</p>

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <User className="h-4 w-4 shrink-0" />
            <span>Dr. {booking.vet_name}</span>
          </div>
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>{dateLabel}</span>
          </div>
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{booking.time} hrs</span>
          </div>
        </div>

        <div className="pt-2 border-t space-y-1.5">
          {selectedServices.map((s) => (
            <div key={s.id} className="flex justify-between text-sm">
              <span>{s.name}</span>
              <span className="text-muted-foreground">${Number(s.base_price).toFixed(0)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold pt-1 border-t text-sm">
            <span>Total</span>
            <span>${total.toFixed(2)} MXN</span>
          </div>
        </div>
      </div>

      {/* Seleccionar mascota */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <PawPrint className="h-3.5 w-3.5" />
          ¿Para qué mascota es la cita? *
        </Label>
        {pets.length === 0 ? (
          <p className="text-sm text-destructive">
            No tienes mascotas registradas. Agrega una desde tu dashboard.
          </p>
        ) : (
          <Select
            value={selectedPetId}
            onValueChange={(id) => {
              const pet = pets.find((p) => p.id === id)
              onPetChange(id, pet?.name ?? '')
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una mascota" />
            </SelectTrigger>
            <SelectContent>
              {pets.map((pet) => (
                <SelectItem key={pet.id} value={pet.id}>
                  {pet.name} — {pet.species}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Notas */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">
          Notas adicionales
          <span className="ml-1 text-xs text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Síntomas, comportamiento reciente, medicamentos actuales..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

    </div>
  )
}