'use client'

import { verifyVeterinario, toggleUserActive } from "@/lib/actions/admin"
import { ShieldCheck, ShieldAlert, UserX, UserCheck, ChevronUp, ChevronDown } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "../ui/badge"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

type VetWithProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  veterinario_profiles: {
    is_verified: boolean
    specialty: string[] | null
    license_number: string | null
    years_experience: number | null
    consultation_fee: number | null
    bio: string | null
  } | null
}

interface VetListProps {
  vets: VetWithProfile[]
}

export function VetList({ vets }: VetListProps) {
  if (vets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-medium">Sin veterinarios registrados</p>
        <p className="text-xs text-muted-foreground mt-1">
          Invita al primer veterinario desde el botón de arriba
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {vets.map((vet) => (
        <VetCard key={vet.id} vet={vet} />
      ))}
    </div>
  )
}

function VetCard({ vet }: { vet: VetWithProfile }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const vetProf = vet.veterinario_profiles

  const handleVerify = () => {
    startTransition(async () => {
      const result = await verifyVeterinario(vet.id)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(`${vet.full_name ?? 'Veterinario'} verificado`)
    })
  }

  const handleToggleActive = () => {
    startTransition(async () => {
      const result = await toggleUserActive(vet.id, !vet.is_active)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(
        vet.is_active
          ? `${vet.full_name ?? 'Veterinario'} desactivado`
          : `${vet.full_name ?? 'Veterinario'} activado`
      )
    })
  }

  return (
    <Card className={!vet.is_active ? 'opacity-60' : undefined}>
      <CardContent className="p-4">

        {/* Fila principal — siempre visible */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={vet.avatar_url ?? undefined} />
            <AvatarFallback className="text-sm">
              {getInitials(vet.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate">
                {vet.full_name ?? 'Sin nombre'}
              </p>
              {/* Badge estado */}
              {!vet.is_active ? (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Inactivo
                </Badge>
              ) : vetProf?.is_verified ? (
                <Badge variant="outline" className="text-xs text-green-600 border-green-300 dark:text-green-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Verificado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  Sin verificar
                </Badge>
              )}
            </div>

            {/* Especialidades en la fila principal */}
            {vetProf?.specialty && vetProf.specialty.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {vetProf.specialty.join(' · ')}
              </p>
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center gap-2 shrink-0">
            {vet.is_active && !vetProf?.is_verified && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                disabled={isPending}
                onClick={handleVerify}
              >
                Verificar
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className={`text-xs h-7 ${vet.is_active ? 'text-destructive hover:text-destructive' : 'text-muted-foreground'}`}
              disabled={isPending}
              onClick={handleToggleActive}
            >
              {vet.is_active ? (
                <><UserX className="h-3.5 w-3.5 mr-1" />Desactivar</>
              ) : (
                <><UserCheck className="h-3.5 w-3.5 mr-1" />Activar</>
              )}
            </Button>

            {/* Toggle collapse */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded
                ? <ChevronUp className="h-4 w-4" />
                : <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>

        {/* Detalle expandido */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cédula profesional</p>
                <p className="font-medium mt-0.5">
                  {vetProf?.license_number ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Años de experiencia</p>
                <p className="font-medium mt-0.5">
                  {vetProf?.years_experience != null
                    ? `${vetProf.years_experience} años`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tarifa de consulta</p>
                <p className="font-medium mt-0.5">
                  {vetProf?.consultation_fee != null
                    ? `$${vetProf.consultation_fee} MXN`
                    : '—'}
                </p>
              </div>
            </div>

            {vetProf?.bio && (
              <div>
                <p className="text-xs text-muted-foreground">Bio</p>
                <p className="text-sm mt-0.5">{vetProf.bio}</p>
              </div>
            )}

            {vet.phone && (
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="text-sm mt-0.5">{vet.phone}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground">Registrado el</p>
              <p className="text-sm mt-0.5">{formatDate(vet.created_at)}</p>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}