'use client'

import { updateVetProfile } from "@/lib/actions/veterinario"
import { VetProfileFormData, vetProfileSchema } from "@/lib/validations/veterinario"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Alert, AlertDescription } from "../ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Plus, X } from "lucide-react"
import { Label } from "../ui/label"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

interface VetProfileFormProps {
    defaultValues: Partial<VetProfileFormData>
}

export function VetProfileForm({ defaultValues }: VetProfileFormProps) {
    const [isPending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)
    const [specialtyInput, setSpecialtyInput] = useState('')

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: {errors}
    } = useForm<VetProfileFormData>({
        resolver: zodResolver(vetProfileSchema),
        defaultValues: {
            full_name:'',
            phone:'',
            bio:'',
            license_number: '',
            specialty: [],
            consultation_fee: undefined,
            years_experience: undefined,
            ... defaultValues,
        }
    })
    
    const specialties = watch('specialty') ?? []
    const addSpecialty = () => {
        const trimmed = specialtyInput.trim()
        if(!trimmed || specialties.includes(trimmed)) return
        setValue('specialty', [... specialties, trimmed])
        setSpecialtyInput('')
    }

    const removeSpecialty = (s: string) => {
        setValue('specialty', specialties.filter(sp => sp !== s))
    }

    const onSubmit = (data: VetProfileFormData) => {
        setServerError(null)
        startTransition( async () => {
            const result = await updateVetProfile(data)
            if ('error' in result) {
                setServerError(result.error)
                return
            }
            toast.success('Perfil Actualizado Correctamente')
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
                <Alert variant='destructive'>
                    <AlertDescription>{serverError}</AlertDescription>
                </Alert>
            )}

            {/**/}
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
                    placeholder="Dr. Ana García López"
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
        
                </CardContent>
            </Card>
        
            {/* Perfil profesional */}
            <Card>
                <CardHeader>
                <CardTitle className="text-base">Perfil profesional</CardTitle>
                <CardDescription>Información visible para los clientes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
        
                <div className="space-y-1.5">
                    <Label htmlFor="license_number">Cédula profesional</Label>
                    <Input
                    id="license_number"
                    placeholder="12345678"
                    disabled={isPending}
                    {...register('license_number')}
                    />
                    {errors.license_number && (
                    <p className="text-xs text-destructive">{errors.license_number.message}</p>
                    )}
                </div>
        
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                    <Label htmlFor="years_experience">Años de experiencia</Label>
                    <Input
                        id="years_experience"
                        type="number"
                        min="0"
                        max="60"
                        placeholder="5"
                        disabled={isPending}
                        {...register('years_experience', { valueAsNumber: true })}
                    />
                    {errors.years_experience && (
                        <p className="text-xs text-destructive">{errors.years_experience.message}</p>
                    )}
                    </div>
        
                    <div className="space-y-1.5">
                    <Label htmlFor="consultation_fee">Tarifa de consulta (MXN)</Label>
                    <Input
                        id="consultation_fee"
                        type="number"
                        min="0"
                        placeholder="500"
                        disabled={isPending}
                        {...register('consultation_fee', { valueAsNumber: true })}
                    />
                    {errors.consultation_fee && (
                        <p className="text-xs text-destructive">{errors.consultation_fee.message}</p>
                    )}
                    </div>
                </div>
        
                {/* Especialidades */}
                <div className="space-y-1.5">
                    <Label>Especialidades</Label>
                    <div className="flex gap-2">
                    <Input
                        placeholder="Ej: Cirugía, Dermatología..."
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        onKeyDown={(e) => {
                        // Agregar con Enter sin hacer submit del form
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            addSpecialty()
                        }
                        }}
                        disabled={isPending}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={addSpecialty}
                        disabled={isPending || !specialtyInput.trim()}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    </div>
        
                    {specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {specialties.map((s) => (
                        <Badge key={s} variant="secondary" className="gap-1 pr-1">
                            {s}
                            <button
                            type="button"
                            onClick={() => removeSpecialty(s)}
                            className="hover:text-destructive transition-colors ml-1"
                            >
                            <X className="h-3 w-3" />
                            </button>
                        </Badge>
                        ))}
                    </div>
                    )}
        
                    {errors.specialty && (
                    <p className="text-xs text-destructive">{errors.specialty.message}</p>
                    )}
                </div>
        
                {/* Bio */}
                <div className="space-y-1.5">
                    <Label htmlFor="bio">
                    Descripción
                    <span className="ml-1 text-xs text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <textarea
                    id="bio"
                    rows={3}
                    placeholder="Cuéntales a los clientes sobre tu experiencia y enfoque..."
                    disabled={isPending}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
                    {...register('bio')}
                    />
                    {errors.bio && (
                    <p className="text-xs text-destructive">{errors.bio.message}</p>
                    )}
                </div>
        
                </CardContent>
            </Card>
        
            <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
        </form>
    )
}