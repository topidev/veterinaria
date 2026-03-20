// src/components/mascotas/AddPetModal.tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { addPetSchema, type AddPetFormData } from '@/lib/validations/pets'
import { addPet } from '@/lib/actions/pets'
import { Constants } from '@/types/supabase'

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  rabbit: 'Conejo',
  other: 'Otro',
}

interface AddPetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPetModal({ open, onOpenChange }: AddPetModalProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddPetFormData, any, AddPetFormData>({
    resolver: zodResolver(addPetSchema) as any,
    defaultValues: { is_neutered: false },
  })

  const onSubmit = (data: AddPetFormData) => {
    startTransition(async () => {
      const result = await addPet(data)

      if ('error' in result) {
        toast.error(result.error)
        return
      }

      // Aquí usamos Sonner — acción no crítica que no redirige
      toast.success('Mascota agregada correctamente')
      reset()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar mascota</DialogTitle>
          <DialogDescription>
            Ingresa los datos de tu mascota
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">

          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Firulais"
              disabled={isPending}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Especie + Raza en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Especie *</Label>
              <Select
                disabled={isPending}
                onValueChange={(val) => setValue('species', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent className='bg-background'>
                  {Constants.public.Enums.pet_species.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SPECIES_LABELS[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.species && (
                <p className="text-xs text-destructive">{errors.species.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="breed">Raza</Label>
              <Input
                id="breed"
                placeholder="Labrador"
                disabled={isPending}
                {...register('breed')}
              />
            </div>
          </div>

          {/* Fecha nacimiento + Peso en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date_of_birth">Fecha de nacimiento</Label>
              <Input
                id="date_of_birth"
                type="date"
                disabled={isPending}
                {...register('date_of_birth')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="weight_kg">Peso (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.1"
                placeholder="4.5"
                disabled={isPending}
                {...register('weight_kg', { valueAsNumber: true })}
              />
              {errors.weight_kg && (
                <p className="text-xs text-destructive">{errors.weight_kg.message}</p>
              )}
            </div>
          </div>

          {/* Sexo */}
          <div className="space-y-1.5">
            <Label>Sexo</Label>
            <Select
              disabled={isPending}
              onValueChange={(val) => setValue('sex', val as 'male' | 'female')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent className='bg-background top-auto'>
                <SelectItem value="male">Macho</SelectItem>
                <SelectItem value="female">Hembra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Esterilizado */}
          <div className="flex items-center gap-2">
            <input
              id="is_neutered"
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              {...register('is_neutered')}
            />
            <Label htmlFor="is_neutered" className="font-normal cursor-pointer">
              Esterilizado / castrado
            </Label>
          </div>

          {/* Notas médicas */}
          <div className="space-y-1.5">
            <Label htmlFor="medical_notes">
              Notas médicas{' '}
              <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <textarea
              id="medical_notes"
              placeholder="Alergias, condiciones crónicas..."
              rows={2}
              draggable
              disabled={isPending}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
              {...register('medical_notes')}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar mascota'}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}