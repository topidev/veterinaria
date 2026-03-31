// src/components/admin/ServiceForm.tsx
'use client'

import { useTransition } from 'react'
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
import {
  DialogFooter,
} from '@/components/ui/dialog'

import { serviceSchema, CATEGORIES, type ServiceFormData } from '@/lib/validations/service'
import { createService, updateService } from '@/lib/actions/admin/services'
import type { Service } from '@/types/supabase'
import { useState } from 'react'

interface ServiceFormProps {
  service?: Service       // si existe = modo edición
  onSuccess: () => void   // callback para cerrar el modal
}

export function ServiceForm({ service, onSuccess }: ServiceFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = !!service

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      base_price: service?.base_price ?? 0,
      duration_minutes: service?.duration_minutes ?? 30,
      category: (service?.category as any) ?? 'consulta',
    },
  })

  const onSubmit = (data: ServiceFormData) => {
    setServerError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateService(service.id, data)
        : await createService(data)

      if ('error' in result) {
        setServerError(result.error)
        return
      }

      toast.success(isEditing ? 'Servicio actualizado' : 'Servicio creado')
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

      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre del servicio</Label>
        <Input
          id="name"
          placeholder="Consulta general"
          disabled={isPending}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">
          Descripción
          <span className="ml-1 text-xs text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <textarea
          id="description"
          rows={2}
          placeholder="Descripción visible al cliente..."
          disabled={isPending}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="base_price">Precio base (MXN)</Label>
          <Input
            id="base_price"
            type="number"
            min="0"
            step="0.01"
            placeholder="350.00"
            disabled={isPending}
            {...register('base_price', { valueAsNumber: true })}
          />
          {errors.base_price && (
            <p className="text-xs text-destructive">{errors.base_price.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="duration_minutes">Duración (minutos)</Label>
          <Input
            id="duration_minutes"
            type="number"
            min="5"
            step="5"
            placeholder="30"
            disabled={isPending}
            {...register('duration_minutes', { valueAsNumber: true })}
          />
          {errors.duration_minutes && (
            <p className="text-xs text-destructive">{errors.duration_minutes.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Categoría</Label>
        <Select
          defaultValue={service?.category ?? 'consulta'}
          disabled={isPending}
          onValueChange={(val) => setValue('category', val as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona categoría" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending
            ? 'Guardando...'
            : isEditing ? 'Guardar cambios' : 'Crear servicio'}
        </Button>
      </DialogFooter>

    </form>
  )
}