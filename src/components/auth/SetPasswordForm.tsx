// src/components/auth/SetPasswordForm.tsx
'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth'
import { setNewPassword } from '@/lib/actions/auth'

interface SetPasswordFormProps {
  title: string
  description: string
}

export function SetPasswordForm({ title, description }: SetPasswordFormProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm_password: '' },
  })

  const onSubmit = (data: ResetPasswordFormData) => {
    startTransition(async () => {
      await setNewPassword(data)
      // setNewPassword hace redirect() si tiene éxito
      // si falla lanza error que Next.js maneja
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

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
            {isPending ? 'Guardando...' : 'Guardar contraseña'}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}