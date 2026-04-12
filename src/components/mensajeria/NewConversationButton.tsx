// src/components/mensajeria/NewConversationButton.tsx

import { CreateConversation } from "@/lib/mensajeria"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Plus } from "lucide-react"


export function NewConversationButton() {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [isPending, startTransition] = useTransition()
  const route = useRouter()

  const handleCreate = () => {
    if (!subject.trim()) return

    startTransition(async () => {
      const result = await CreateConversation(subject)

      if ('error' in result) {
        toast.error(result.error)
        return
      }

      setOpen(false)
      setSubject('')
      route.push(`mensajeria/${result.conversationId}`)

    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Nueva consulta
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva consulta</DialogTitle>
            <DialogDescription>
              Describe brevemente tu consulta y un veterinario te responderá
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                placeholder="Ej: Mi perro no quiere comer..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isPending}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={isPending || !subject.trim()}
              >
                {isPending ? 'Creando...' : 'Crear consulta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}