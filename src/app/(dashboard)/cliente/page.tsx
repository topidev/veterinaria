// src/app/(dashboard)/cliente/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi dashboard' }

export default function ClienteDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen de tus mascotas y citas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Mis mascotas', value: '—' },
          { label: 'Próxima cita', value: '—' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium mb-3">Mis mascotas</p>
        <p className="text-xs text-muted-foreground">
          Agrega tu primera mascota en Sprint 2.
        </p>
      </div>
    </div>
  )
}