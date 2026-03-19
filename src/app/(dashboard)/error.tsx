// src/app/(dashboard)/error.tsx
'use client'

export default function DashboardError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Error en dashboard</h2>
      <pre style={{ color: 'red' }}>{error.message}</pre>
      <pre>{error.stack}</pre>
    </div>
  )
}