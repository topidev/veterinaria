// src/components/mascotas/AddMedicalRecordForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { medicalRecordSchema, type MedicalRecordFormData } from '@/lib/validations/pets'
import { createMedicalRecord } from '@/lib/actions/pets'

const RECORD_TYPES = [
  { value: 'vacuna',          label: 'Vacuna' },
  { value: 'desparasitacion', label: 'Desparasitación' },
  { value: 'cirugia',         label: 'Cirugía' },
  { value: 'consulta',        label: 'Consulta' },
  { value: 'otro',            label: 'Otro' },
]

interface AddMedicalRecordFormProps {
  petId:          string
  currentWeight?: number | null   // peso actual para mostrarlo como referencia
  appointmentId?: string
  onSuccess:      () => void
}

export function AddMedicalRecordForm({
  petId,
  currentWeight,
  appointmentId,
  onSuccess,
}: AddMedicalRecordFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<MedicalRecordFormData>({
      resolver: zodResolver(medicalRecordSchema),
      defaultValues: {
        pet_id:         petId,
        appointment_id: appointmentId ?? '',
        date:           today,
        type:           'consulta',
      },
    })

  const onSubmit = (data: MedicalRecordFormData) => {
    setServerError(null)
    startTransition(async () => {
      const result = await createMedicalRecord(data)
      if ('error' in result) {
        setServerError(result.error)
        return
      }
      toast.success('Registro guardado correctamente')
      onSuccess()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Tipo */}
      <div className="space-y-1.5">
        <Label>Tipo de registro</Label>
        <Select
          defaultValue="consulta"
          onValueChange={(val) => setValue('type', val as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            {RECORD_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-xs text-destructive">{errors.type.message}</p>
        )}
      </div>

      {/* Título */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          placeholder="Ej: Vacuna antirrábica anual"
          disabled={isPending}
          {...register('title')}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <Label htmlFor="description">
          Descripción
          <span className="ml-1 text-xs text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <textarea
          id="description"
          rows={3}
          placeholder="Observaciones, dosis, reacciones..."
          disabled={isPending}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
          {...register('description')}
        />
      </div>

      {/* Peso + Fecha */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="weight_kg">
            Peso (kg)
            <span className="ml-1 text-xs text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="weight_kg"
            type="number"
            step="0.1"
            min="0"
            placeholder={currentWeight ? `Actual: ${currentWeight} kg` : 'Ej: 8.5'}
            disabled={isPending}
            {...register('weight_kg', { valueAsNumber: true })}
          />
          {errors.weight_kg && (
            <p className="text-xs text-destructive">{errors.weight_kg.message}</p>
          )}
          {currentWeight && (
            <p className="text-xs text-muted-foreground">
              Peso anterior: {currentWeight} kg
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            type="date"
            disabled={isPending}
            {...register('date')}
          />
          {errors.date && (
            <p className="text-xs text-destructive">{errors.date.message}</p>
          )}
        </div>
      </div>

      {/* Próxima dosis */}
      <div className="space-y-1.5">
        <Label htmlFor="next_due_date">
          Próxima dosis / revisión
          <span className="ml-1 text-xs text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="next_due_date"
          type="date"
          disabled={isPending}
          {...register('next_due_date')}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar registro'}
      </Button>
    </form>
  )
}