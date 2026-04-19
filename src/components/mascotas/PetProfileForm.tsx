// src/components/mascotas/PetProfileForm.tsx
'use client'

import { updatePet } from "@/lib/actions/pets"
import { PetProfileFormData, petProfileSchema } from "@/lib/validations/pets"
import { Pet } from "@/types/supabase"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Alert, AlertDescription } from "../ui/alert"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"


interface PetProfileFormProps {
    pet: Pet
}

export function PetProfileForm({ pet }: PetProfileFormProps) {
    const [isPending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)

    const { register, handleSubmit, setValue, formState: { errors }} = useForm<PetProfileFormData>({
        resolver: zodResolver(petProfileSchema),
        defaultValues: {
            name: pet.name,
            breed: pet.breed ?? '',
            date_of_birth: pet.date_of_birth ?? '',
        },
    })

    const onSubmit = (data: PetProfileFormData) => {
        setServerError(null)
        startTransition(async () => {
            const result = await updatePet(pet.id, data)
            if('error' in result ) {
                setServerError(result.error)
                return
            }
            toast.success('Mascota actualizada')
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
                <Alert variant='destructive'>
                    <AlertDescription>{serverError}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                    id="name"
                    placeholder="Nombre de tu mascota"
                    disabled={isPending}
                    {...register('name')} 
                />
                {errors.name && (
                    <p className="text-xs text-destructive">
                        {errors.name.message}
                    </p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="breed">
                    Raza
                    <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input 
                    id="bredd"
                    placeholder="Labrador, Siamés, Mestizo"
                    disabled={isPending}
                    {...register('breed')}
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="date_of_birth">
                    Fecha de nacimiento
                <span className="ml-1 text-xs text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                    id="date_of_birth"
                    type="date"
                    disabled={isPending}
                    {...register('date_of_birth')}
                />
            </div>

            <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardando cambios'}
            </Button>
        </form>
    )
}