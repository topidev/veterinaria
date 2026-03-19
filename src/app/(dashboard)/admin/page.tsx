// src/app/(dashboard)/admin/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard Admin' }

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bienvenido al panel de administración
        </p>
      </div>

      {/* Metric cards placeholder — Sprint 2 los llena con datos reales */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Citas hoy', value: '—' },
          { label: 'Clientes activos', value: '—' },
          { label: 'Veterinarios', value: '—' },
          { label: 'Ingresos mes', value: '—' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border bg-card p-4 space-y-1"
          >
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla placeholder */}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium mb-3">Actividad reciente</p>
        <p className="text-xs text-muted-foreground">
          Los datos reales se conectan en Sprint 2.
        </p>
      </div>
    </div>
  )
}