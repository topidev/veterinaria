// src/components/cliente/ClienteProfileForm.tsx
'use client'

import { updateClientProfile } from "@/lib/actions/cliente";
import { ClienteProfileFormData, clienteProfileSchema } from "@/lib/validations/cliente";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { redirect } from "next/navigation";

interface ClienteProfileFormProps {
  defaultValues: Partial<ClienteProfileFormData>
}

export function ClienteProfileForm({ defaultValues }: ClienteProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteProfileFormData>({
    resolver: zodResolver(clienteProfileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      address: '',
      emergency_name: '',
      emergency_phone: '',
      emergency_relation: '',
      ...defaultValues
    }
  })

  const onSubmit = (data: ClienteProfileFormData) => {
    setServerError(null)
    startTransition(async () => {
      const result = await updateClientProfile(data)
      console.log("[ClientForm] Result: ", result)
      if ('error' in result) {
        setServerError(result.error)
        return
      }
      toast.success('Perfil actualizado correctamente')
      redirect('/dashboard/cliente')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Datos personales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
          <CardDescription>Tu nombre e información de contacto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input
              id="full_name"
              placeholder="Ana García López"
              disabled={isPending}
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Teléfono
              <span className="ml-1 text-xs text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+52 55 1234 5678"
              disabled={isPending}
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">
              Dirección
              <span className="ml-1 text-xs text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="address"
              placeholder="Calle, número, colonia, ciudad"
              disabled={isPending}
              {...register('address')}
            />
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address.message}</p>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Contacto de emergencia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacto de emergencia</CardTitle>
          <CardDescription>
            A quién contactar en caso de emergencia durante una consulta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-1.5">
            <Label htmlFor="emergency_name">Nombre</Label>
            <Input
              id="emergency_name"
              placeholder="Carlos García"
              disabled={isPending}
              {...register('emergency_name')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="emergency_phone">Teléfono</Label>
              <Input
                id="emergency_phone"
                type="tel"
                placeholder="+52 55 8765 4321"
                disabled={isPending}
                {...register('emergency_phone')}
              />
              {errors.emergency_phone && (
                <p className="text-xs text-destructive">{errors.emergency_phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emergency_relation">Relación</Label>
              <Input
                id="emergency_relation"
                placeholder="Esposo, madre, hermano..."
                disabled={isPending}
                {...register('emergency_relation')}
              />
            </div>
          </div>

        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </Button>

    </form>
  )

}