// src/components/mascotas/AddPetButton.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AddPetModal } from './AddPetModal'

interface AddPetButtonProps {
  variant?: 'default' | 'outline'
  label?: string
}

export function AddPetButton({
  variant = 'default',
  label = 'Agregar mascota',
}: AddPetButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {label}
      </Button>
      <AddPetModal open={open} onOpenChange={setOpen} />
    </>
  )
}