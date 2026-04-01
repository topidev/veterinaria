// src/components/reservaciones/StepVet.tsx
'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'
import type { VetOption } from './BookingFlow'

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

interface StepVetProps {
  vets: VetOption[]
  selectedVetId?: string
  onSelect: (vet: VetOption) => void
}

export function StepVet({ vets, selectedVetId, onSelect }: StepVetProps) {
  if (vets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="font-medium">No hay veterinarios disponibles</p>
        <p className="text-sm text-muted-foreground mt-1">
          Contacta a la clínica para más información
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Selecciona el veterinario para tu cita</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {vets.map((vet) => (
          <Card
            key={vet.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedVetId === vet.id ? 'border-primary ring-1 ring-primary' : ''
            }`}
            onClick={() => onSelect(vet)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={vet.avatar_url ?? undefined} />
                  <AvatarFallback>{getInitials(vet.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm truncate">{vet.full_name}</p>
                    {vet.veterinario_profiles?.is_verified && (
                      <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    )}
                  </div>
                  {vet.veterinario_profiles?.specialty && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {vet.veterinario_profiles.specialty.slice(0, 2).join(', ')}
                    </p>
                  )}
                  {vet.veterinario_profiles?.consultation_fee && (
                    <p className="text-xs font-medium mt-1">
                      ${vet.veterinario_profiles.consultation_fee} MXN / consulta
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}