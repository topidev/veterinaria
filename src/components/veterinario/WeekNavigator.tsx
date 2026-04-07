'use client'
import { useRouter } from "next/navigation"
import { toDotPath } from "zod/v4/core"
import { Button } from "../ui/button"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

interface WeekNavigatorProps {
    weekStart: string
}

function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr + 'T12:00:00')
    date.setDate(date.getDate()+days)
    return date.toISOString().split('T')[0]
}

function formatWeekLabel(weekStart: string):string {
    const start = new Date(weekStart + 'T12:00:00')
    const end = new Date(weekStart + 'T12:00:00')
    end.setDate(end.getDate() + 6)
    const sameMonth = start.getMonth() === end.getMonth()

    if (sameMonth){
        return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('es-MX', {
            month: 'long',
            year: 'numeric'
        })}`
    }

    return `${start.getDate()} ${start.toLocaleDateString('es-MX', {
        month:'short'
    })} - ${end.getDate()} ${end.toLocaleDateString('es-MX', {
        month:'short',
        year:'numeric'
    })}`
}
export function WeekNavigator({weekStart}: WeekNavigatorProps) {
    const router = useRouter()
    const goToWeek = (date: string) => {
        router.push(`/dashboard/veterinario/agenda?semana=${date}`)
    }

    const prevWeek = addDays(weekStart, -7)
    const nextWeek = addDays(weekStart, 7)

    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const thisMonday = new Date(today)
    thisMonday.setDate(today.getDate() + diff)
    const thisMondayStr = thisMonday.toISOString().split('T')[0]
    const isCurrentWeek = weekStart === thisMondayStr

    return (
        <div className="flex items-center gap-3">
        <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToWeek(prevWeek)}
        >
            <ChevronLeft className="h-4 w-4" />
        </Button>
    
        <div className="flex items-center gap-2 min-w-48 justify-center">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{formatWeekLabel(weekStart)}</span>
        </div>
    
        <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToWeek(nextWeek)}
        >
            <ChevronRight className="h-4 w-4" />
        </Button>
    
        {!isCurrentWeek && (
            <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8"
            onClick={() => goToWeek(thisMondayStr)}
            >
            Hoy
            </Button>
        )}
        </div>
    )
}