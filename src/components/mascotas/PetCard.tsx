
// src/components/mascotas/PetCard.tsx

import { Pet } from "@/types/supabase"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import Image from "next/image"
import Link from "next/link"

const SPECIES_CONFING: Record<string, { emoji: string, label: string }> = {
  dog: { emoji: '🐩', label: 'Perro' },
  cat: { emoji: '🐈', label: 'Gato' },
  bird: { emoji: '🦜', label: 'Ave' },
  rabbit: { emoji: '🐇', label: 'Conejo' },
  other: { emoji: '🐾', label: 'Otro' },
}

function getAge(dateOfBird: string | null): string {
  if (!dateOfBird) return 'Edad Desconocida'

  const birth = new Date(dateOfBird)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()

  if (years === 0) {
    const totalMonths = months < 0 ? months + 12 : months
    return totalMonths <= 1 ? '1 Mes' : `${totalMonths} meses`
  }
  return years === 1 ? '1 año' : `${years} años`
}

interface PetCardProps {
  pet: Pet,
  href?: string
}

export function PetCard({ pet, href }: PetCardProps) {
  const species = SPECIES_CONFING[pet.species] ?? SPECIES_CONFING.other

  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer w-full max-w-96 mx-auto md:max-w-none md:mx-0">
      <CardContent className="p-4">

        {/* Foto o avatar con emoji */}
        <div className="relative h-42 w-full shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center mb-10">
          {pet.photo_url ? (
            <Image
              src={pet.photo_url}
              alt={pet.name}
              fill
              className="object-cover"
              sizes="512px"
            />
          ) : (
            <span className="text-2xl">{species.emoji}</span>
          )}
        </div>
        <div className="flex items-start gap-3">


          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold truncate">{pet.name}</h3>
              <Badge variant="default" className="text-xs shrink-0">
                {species.label}
              </Badge>
            </div>

            {pet.breed && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {pet.breed}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 mt-2.5">
              <span className="text-xs text-muted-foreground">
                {getAge(pet.date_of_birth)}
              </span>
              {pet.weight_kg && (
                <span className="text-xs text-muted-foreground">
                  {pet.weight_kg} kg
                </span>
              )}
              {pet.is_neutered && (
                <Badge variant="outline" className="text-xs py-0">
                  Esterilizado
                </Badge>
              )}
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  )
  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}