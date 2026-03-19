// src/app/(dashboard)/veterinario/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi Agenda' }

export default function VeterinarioDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi agenda</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tus citas de hoy
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Citas hoy', value: '—' },
          { label: 'Pendientes', value: '—' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium mb-3">Próximas citas</p>
        <p className="text-xs text-muted-foreground">
          Los datos reales se conectan en Sprint 3.
        </p>
      </div>
    </div>
  )
}