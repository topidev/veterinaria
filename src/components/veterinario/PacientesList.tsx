// src/components/veterinario/PacientesList.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, PawPrint, Scale } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useEffect } from 'react'

const SPECIES_EMOJI: Record<string, string> = {
  perro: '🐶',
  gato: '🐱',
  ave: '🐦',
  conejo: '🐰',
  reptil: '🦎',
  otro: '🐾',
}

type PetWithOwner = {
  id: string
  name: string
  species: string
  breed: string | null
  date_of_birth: string | null
  photo_url: string | null
  weight_kg: number | null
  owner: {
    id: string
    full_name: string | null
    phone: string | null
  } | null
}

interface PacientesListProps {
  pets: PetWithOwner[]
  initialSearch: string
}

export function PacientesList({ pets, initialSearch }: PacientesListProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const debouncedSearch = useDebounce(search, 300)

  // Actualizar searchParams cuando cambia el search
  // El Server Component re-fetcha con el nuevo filtro
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('q', debouncedSearch)
    router.replace(
      `/dashboard/veterinario/pacientes${debouncedSearch ? `?q=${debouncedSearch}` : ''}`
    )
  }, [debouncedSearch])

  // Filtro adicional client-side por nombre del dueño
  // (el server filtra por nombre de mascota, aquí también filtramos por dueño)
  const filtered = pets.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.owner?.full_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por mascota o dueño..."
          className="pl-9"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PawPrint className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium">
            {search ? 'Sin resultados para esa búsqueda' : 'Sin pacientes registrados'}
          </p>
          {search && (
            <p className="text-sm text-muted-foreground mt-1">
              Intenta con otro nombre
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pet) => {
            const age = pet.date_of_birth
              ? Math.floor(
                (Date.now() - new Date(pet.date_of_birth).getTime()) /
                (1000 * 60 * 60 * 24 * 365)
              )
              : null

            return (
              <Link
                key={pet.id}
                href={`/dashboard/veterinario/pacientes/${pet.id}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0 flex items-center justify-center text-2xl">
                        {pet.photo_url ? (
                          <Image
                            src={pet.photo_url}
                            alt={pet.name}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          SPECIES_EMOJI[pet.species] ?? '🐾'
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{pet.name}</p>
                          <Badge variant="outline" className="text-xs capitalize shrink-0">
                            {pet.species}
                          </Badge>
                        </div>

                        {pet.breed && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {pet.breed}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          {age !== null && (
                            <span>{age} año{age !== 1 ? 's' : ''}</span>
                          )}
                          {pet.weight_kg && (
                            <span className="flex items-center gap-0.5">
                              <Scale className="h-3 w-3" />
                              {pet.weight_kg} kg
                            </span>
                          )}
                        </div>

                        {/* Dueño */}
                        {pet.owner?.full_name && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Dueño: {pet.owner.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}