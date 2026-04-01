// src/components/reservaciones/StepFecha.tsx
'use client'

import { useMemo } from 'react'
import type { VetOption } from './BookingFlow'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface StepFechaProps {
  vetId: string
  vets: VetOption[]
  selectedDate?: string
  onSelect: (date: string) => void
}

export function StepFecha({ vetId, vets, selectedDate, onSelect }: StepFechaProps) {
  const vet = vets.find((v) => v.id === vetId)
  const activeDays = new Set(vet?.vet_schedules.map((s) => s.day_of_week) ?? [])

  // Generar los próximos 30 días
  const days = useMemo(() => {
    const result = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dayOfWeek = date.getDay()
      const dateStr = date.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        dayOfWeek,
        label: date.getDate(),
        dayLabel: DIAS[dayOfWeek],
        isAvailable: activeDays.has(dayOfWeek),
        isToday: i === 0,
        month: MESES[date.getMonth()],
        monthChanged: i === 0 || date.getDate() === 1,
      })
    }
    return result
  }, [vetId, activeDays])

  // Agrupar por semanas para mostrar como calendario
  const weeks: typeof days[] = []
  let week: typeof days = []
  days.forEach((day, i) => {
    week.push(day)
    if (week.length === 7 || i === days.length - 1) {
      weeks.push([...week])
      week = []
    }
  })

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Selecciona la fecha de tu cita
      </p>

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {DIAS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((day) => (
              <button
                key={day.date}
                type="button"
                disabled={!day.isAvailable}
                onClick={() => day.isAvailable && onSelect(day.date)}
                className={`
                  py-3 text-sm transition-colors relative
                  ${!day.isAvailable
                    ? 'text-muted-foreground/30 cursor-not-allowed'
                    : selectedDate === day.date
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted cursor-pointer'
                  }
                  ${day.isToday && selectedDate !== day.date ? 'font-semibold' : ''}
                `}
              >
                {day.label}
                {day.isToday && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    selectedDate === day.date ? 'bg-primary-foreground' : 'bg-primary'
                  }`} />
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {selectedDate && (
        <p className="text-sm text-center text-muted-foreground">
          Fecha seleccionada: <span className="font-medium text-foreground">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </span>
        </p>
      )}
    </div>
  )
}