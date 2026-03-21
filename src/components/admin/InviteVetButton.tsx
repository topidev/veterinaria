// src/components/admin/InviteVetButton.tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteVeterinario } from '@/lib/actions/admin'

const inviteSchema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('Correo inválido'),
  full_name: z.string().min(2, 'El nombre es requerido').max(100),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface InviteVetButtonProps {
  variant?: 'default' | 'outline'
}

export function InviteVetButton({ variant = 'default' }: InviteVetButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  })

  const onSubmit = (data: InviteFormData) => {
    console.log("[Invitando Vet...]:", data)
    startTransition(async () => {
      const result = await inviteVeterinario(data.email, data.full_name)

      if ('error' in result) {
        toast.error(result.error)
        return
      }

      toast.success(`Invitación enviada a ${data.email}`)
      reset()
      setOpen(false)
    })
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4 mr-2" />
        Invitar veterinario
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invitar veterinario</DialogTitle>
            <DialogDescription>
              El veterinario recibirá un email para activar su cuenta
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                placeholder="Dr. Ana García"
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
                placeholder="veterinario@correo.com"
                disabled={isPending}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={isPending}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? 'Enviando...' : 'Enviar invitación'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}