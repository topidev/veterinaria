// src/app/(dashboard)/dashboard/cliente/mascotas/[id]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function MascotaLoading() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Avatar */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-28 w-28 rounded-2xl" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Peso */}
      <div className="flex justify-center">
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Formulario */}
      <div className="rounded-xl border p-6 space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Historial */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-36" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}