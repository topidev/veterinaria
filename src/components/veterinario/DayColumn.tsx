'use client'
import { useState } from "react"
import { AppointmentCard, type AppointmentWithDetails } from "./AppointmentCard"
import { cn } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-amber-400',
  confirmed:   'bg-blue-400',
  in_progress: 'bg-purple-400',
  completed:   'bg-green-400',
  cancelled:   'bg-red-300',
}
 
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
 
interface DayColumnProps {
    date: string // YYYY-MM-DD
    appointments: AppointmentWithDetails[]
    isToday: boolean
}

export function DayColumn( {
        date, appointments, isToday
    }: DayColumnProps) {

    const [expanded, setExpanded] = useState(isToday)
    const newDate = new Date(date + 'T12:00:00')
    const active = appointments.filter((a : AppointmentWithDetails) => a.status !== 'cancelled')

    return (
        <div className={cn(
            'rounded-xl border overflow-hidden transition-all',
            isToday && 'border-primary',
        )}>
        {/* Header del día — siempre visible, clickeable */}
        <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn(
                'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                'hover:bg-muted/50',
                isToday ? 'bg-primary/5' : 'bg-muted/30',
            )}
        >
            <div className="flex items-center gap-3">
            <div>
                <p className={cn(
                    'text-sm font-medium',
                    isToday && 'text-primary'
                )}>
                {DIAS[newDate.getUTCDay()]} {newDate.getUTCDate()} {MESES[newDate.getUTCMonth()]}
                </p>
                <p className="text-xs text-muted-foreground">
                {active.length === 0
                    ? 'Sin citas'
                    : `${active.length} cita${active.length !== 1 ? 's' : ''}`}
                </p>
            </div>
            </div>
    
            {/* Dots de status */}
            {active.length > 0 && (
            <div className="flex items-center gap-1">
                {active.slice(0, 5).map((a, i) => (
                <div
                    key={i}
                    className={cn('h-2 w-2 rounded-full', STATUS_COLORS[a.status])}
                />
                ))}
                {active.length > 5 && (
                <span className="text-xs text-muted-foreground">+{active.length - 5}</span>
                )}
            </div>
            )}
        </button>
    
        {/* Citas del día — expandibles */}
        {expanded && (
            <div className="divide-y">
            {appointments.length === 0 ? (
                <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">Sin citas este día</p>
                </div>
            ) : (
                <div className="p-3 space-y-2">
                {appointments.map((a) => (
                    <AppointmentCard key={a.id} appointment={a} />
                ))}
                </div>
            )}
            </div>
        )}
        </div>
    )


}