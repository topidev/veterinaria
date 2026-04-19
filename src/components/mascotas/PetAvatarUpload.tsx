// src/components/mascotas/PetAvatarUpload.tsx
'use client'

import { updatePetAvatar } from "@/lib/actions/pets"
import { createClient } from "@/lib/supabase/client"
import { useRef, useState } from "react"
import { toast } from "sonner"
import Image from 'next/image'
import { Camera, Loader2 } from "lucide-react"

interface PetAvatarUploadProps {
    petId: string
    ownerId: string
    currentUrl: string | null
    petName: string
}

export function PetAvatarUpload({
    petId,
    ownerId,
    currentUrl,
    petName,
}: PetAvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentUrl)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validar tipo y tamaño
        if(!file.type.startsWith('image/')) {
            toast.error('Solo se permiten imágenes')
            return
        }
        if(file.size > 3 * 1024 * 1024) {
            toast.error('La imagen no puede superar 3MB')
            return
        }

        // Preview inmediate con FIleReader
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)

        setLoading(true)

        try {
            const supabase = createClient()

            // Path: {owner_id}/{pet_id} — la extensión real del archivo
            const ext = file.name.split('.').pop() ?? 'jpg'
            const path = `${ownerId}/${petId}.${ext}`

            // Upsert — sobreescribe si ya existe
            const {error: uploadError} = await supabase.storage
                .from('pets')
                .upload(path, file, {upsert: true})
            
            if (uploadError) {
                toast.error('Error al subir la imagen')
                setPreview(currentUrl)
                return
            }

            // Obtener la Url Pública
            const { data: {publicUrl } } = supabase.storage
                .from('pets')
                .getPublicUrl(path)

            const result = await updatePetAvatar(petId, publicUrl)
            if ('error' in result) {
                toast.error(result.error)
                return
            }

            toast.success('Foto Actualizada')
        } catch {
            toast.error('Error inesperado al subir la foto')
            setPreview(currentUrl)
        } finally {
            setLoading(false)
        }

    }

    return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar con botón de cámara encima */}
      <div className="relative group">
        <div className="h-28 w-28 rounded-2xl overflow-hidden bg-muted border">
          {preview ? (
            <Image
              src={preview}
              alt={petName}
              width={112}
              height={112}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🐾
            </div>
          )}
        </div>
 
        {/* Overlay con cámara al hover */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          {loading
            ? <Loader2 className="h-6 w-6 text-white animate-spin" />
            : <Camera className="h-6 w-6 text-white" />
          }
        </button>
      </div>
 
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {loading ? 'Subiendo...' : 'Cambiar foto'}
      </button>
 
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}