// src/components/admin/VerifyVetButton.tsx
'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { verifyVeterinario } from '@/lib/actions/admin'

interface VerifyVetButtonProps {
  vetId: string
  vetName: string | null
}

export function VerifyVetButton({ vetId, vetName }: VerifyVetButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleVerify = () => {
    startTransition(async () => {
      console.log("[handleVerify]")
      const result = await verifyVeterinario(vetId)
      console.log("[handleVerify - ]: ", result)

      if ('error' in result) {
        toast.error(result.error)
        return
      }

      toast.success(`${vetName ?? 'Veterinario'} verificado correctamente`)
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-xs h-7 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
      disabled={isPending}
      onClick={handleVerify}
    >
      <ShieldCheck className="h-3 w-3 mr-1" />
      {isPending ? 'Verificando...' : 'Verificar'}
    </Button>
  )
}