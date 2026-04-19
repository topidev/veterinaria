// src/components/mascotas/MedicalHistory.tsx
'use client'

import { MedicalRecord, RecordType } from "@/types/supabase";
import { Bug, ChevronDown, ChevronUp, FileText, Plus, Scissors, Stethoscope, Syringe } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { AddMedicalRecordForm } from "./AddMedicalRecordForm";



const TYPE_CONFIG: Record<RecordType, { label: string; icon: React.ElementType; color: string }> = {
    vacuna: {
        label: 'Vacuna',
        icon: Syringe,
        color: 'text-blue-600 border-blue-300 dark:text-blue-400'
    },
    desparasitacion: {
        label: 'Desparasitación',
        icon: Bug,
        color: 'text-green-600 border-green-300 dark: text-green-400'
    },
    cirugia: { 
        label: 'Cirugía',          
        icon: Scissors,    
        color: 'text-red-600 border-red-300 dark:text-red-400' 
    },
    consulta: { 
        label: 'Consulta',         
        icon: Stethoscope, 
        color: 'text-purple-600 border-purple-300 dark:text-purple-400' 
    },
    otro: { 
        label: 'Otro',             
        icon: FileText,    
        color: 'text-gray-600 border-gray-300' 
    },
}

interface MedicalHistoryProps {
    records: MedicalRecord[]
    petId: string
    canAdd?: boolean // true para vets, false para clientes
}

export function MedicalHistory({
    records,
    petId,
    canAdd = false
}: MedicalHistoryProps) {
    const [addOpen, setAddOpen] = useState(false)
    const [expanded, setExpanded] = useState<string | null>(null)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Historial clínico</h2>
                {canAdd && (
                <Button size="sm" onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar registro
                </Button>
                )}
            </div>
        
            {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed">
                    <Stethoscope className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium">Sin registros clínicos</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {canAdd
                        ? 'Agrega el primer registro con el botón de arriba'
                        : 'El veterinario agregará registros después de cada consulta'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {records.map((record) => {
                        const config = TYPE_CONFIG[record.type]
                        const Icon   = config.icon
                        const isOpen = expanded === record.id
            
                        return (
                        <Card key={record.id}>
                            <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
            
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium truncate">{record.title}</p>
                                        <Badge variant="outline" className={`text-xs ${config.color}`}>
                                            {config.label}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(record.date + 'T12:00:00').toLocaleDateString('es-MX', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                        })}
                                        {record.next_due_date && (
                                        <span className="ml-2 text-amber-600 dark:text-amber-400">
                                            · Próxima: {new Date(record.next_due_date + 'T12:00:00').toLocaleDateString('es-MX', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </span>
                                        )}
                                    </p>
                                </div>
            
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0"
                                    onClick={() => setExpanded(isOpen ? null : record.id)}
                                >
                                {isOpen
                                    ? <ChevronUp className="h-4 w-4" />
                                    : <ChevronDown className="h-4 w-4" />
                                }
                                </Button>
                            </div>
            
                            {isOpen && record.description && (
                                <div className="mt-3 pt-3 border-t">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {record.description}
                                </p>
                                </div>
                            )}
                            </CardContent>
                        </Card>
                        )
                    })}
                </div>
            )}
        
            {/* Modal para agregar registro — solo para vets */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Nuevo registro clínico</DialogTitle>
                    <DialogDescription>
                    Agrega una entrada al historial de esta mascota
                    </DialogDescription>
                </DialogHeader>
                <AddMedicalRecordForm
                    petId={petId}
                    onSuccess={() => setAddOpen(false)}
                />
                </DialogContent>
            </Dialog>
        </div>
    )
}