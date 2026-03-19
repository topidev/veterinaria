// src/components/auth/RegisterForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'
import { register as registerAction } from '@/lib/actions/auth'

export function RegisterForm() {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    },
  })

  const onSubmit = (data: RegisterFormData) => {
    setServerError(null)
    startTransition(async () => {
      const result = await registerAction(data)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>Completa tus datos para comenzar</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input
              id="full_name"
              type="text"
              autoComplete="name"
              placeholder="Ana García López"
              disabled={isPending}
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              disabled={isPending}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Teléfono{' '}
              <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+52 55 1234 5678"
              disabled={isPending}
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              disabled={isPending}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirmar contraseña</Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              disabled={isPending}
              {...register('confirm_password')}
            />
            {errors.confirm_password && (
              <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>

        </form>

        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="font-medium text-foreground hover:underline">
            Inicia sesión
          </a>
        </p>

      </CardContent>
    </Card>
  )
}