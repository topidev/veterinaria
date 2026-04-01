// src/components/reservaciones/BookingFlow.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StepVet }      from './StepVet'
import { StepFecha }    from './StepFecha'
import { StepSlot }     from './StepSlot'
import { StepServicios } from './StepServicios'
import { StepConfirmar } from './StepConfirmar'

import { createAppointment } from '@/lib/actions/reservaciones'
import type { Service, Pet } from '@/types/supabase'

// Tipo para los vets disponibles (con horario)
export type VetOption = {
  id: string
  full_name: string | null
  avatar_url: string | null
  veterinario_profiles: {
    specialty: string[] | null
    consultation_fee: number | null
    is_verified: boolean
  } | null
  vet_schedules: { day_of_week: number }[]
}

// Estado del booking
export type BookingState = {
  vet_id:         string
  vet_name:       string
  pet_id:         string
  pet_name:       string
  date:           string  // YYYY-MM-DD
  time:           string  // HH:MM
  service_ids:    string[]
  notes:          string
}

const STEPS = ['Veterinario', 'Fecha', 'Horario', 'Servicios', 'Confirmar']

interface BookingFlowProps {
  vets:     VetOption[]
  services: Service[]
  pets:     Pet[]
}

export function BookingFlow({ vets, services, pets }: BookingFlowProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(0)

  const [booking, setBooking] = useState<Partial<BookingState>>({
    service_ids: [],
    notes: '',
  })

  const update = (data: Partial<BookingState>) => {
    setBooking((prev) => ({ ...prev, ...data }))
  }

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const handleConfirm = () => {
    if (
      !booking.vet_id || !booking.pet_id ||
      !booking.date || !booking.time ||
      !booking.service_ids?.length
    ) {
      toast.error('Faltan datos para completar la reservación')
      return
    }

    startTransition(async () => {
      const result = await createAppointment({
        vet_id:         booking.vet_id!,
        pet_id:         booking.pet_id!,
        scheduled_date: booking.date!,
        scheduled_time: booking.time!,
        service_ids:    booking.service_ids!,
        notes:          booking.notes,
      })

      if ('error' in result) {
        toast.error(result.error)
        return
      }

      toast.success('¡Cita agendada correctamente!')
      router.push('/dashboard/cliente')
    })
  }

  return (
    <div className="space-y-6">

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className={`
              flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium shrink-0 transition-colors
              ${i < step
                ? 'bg-primary text-primary-foreground'
                : i === step
                ? 'bg-primary/10 text-primary border border-primary'
                : 'bg-muted text-muted-foreground'
              }
            `}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-1 ${i < step ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Contenido del paso actual */}
      <div className="min-h-64">
        {step === 0 && (
          <StepVet
            vets={vets}
            selectedVetId={booking.vet_id}
            onSelect={(vet) => {
              update({ vet_id: vet.id, vet_name: vet.full_name ?? '', date: '', time: '' })
              next()
            }}
          />
        )}
        {step === 1 && (
          <StepFecha
            vetId={booking.vet_id!}
            vets={vets}
            selectedDate={booking.date}
            onSelect={(date) => {
              update({ date, time: '' })
              next()
            }}
          />
        )}
        {step === 2 && (
          <StepSlot
            vetId={booking.vet_id!}
            date={booking.date!}
            selectedTime={booking.time}
            onSelect={(time) => {
              update({ time })
              next()
            }}
          />
        )}
        {step === 3 && (
          <StepServicios
            services={services}
            selectedIds={booking.service_ids ?? []}
            onChange={(ids) => update({ service_ids: ids })}
          />
        )}
        {step === 4 && (
          <StepConfirmar
            booking={booking as BookingState}
            services={services}
            pets={pets}
            selectedPetId={booking.pet_id}
            notes={booking.notes ?? ''}
            onPetChange={(petId, petName) => update({ pet_id: petId, pet_name: petName })}
            onNotesChange={(notes) => update({ notes })}
          />
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={back}
          disabled={step === 0 || isPending}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Atrás
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={next}
            disabled={
              (step === 0 && !booking.vet_id) ||
              (step === 1 && !booking.date) ||
              (step === 2 && !booking.time) ||
              (step === 3 && !booking.service_ids?.length)
            }
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            disabled={isPending || !booking.pet_id}
          >
            {isPending ? 'Confirmando...' : 'Confirmar cita'}
          </Button>
        )}
      </div>

    </div>
  )
}