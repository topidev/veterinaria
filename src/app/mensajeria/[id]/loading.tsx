import { Skeleton } from '@/components/ui/skeleton'
 
export default function ConversacionLoading() {
  return (
    <div className="flex flex-col h-full">
 
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
      </div>
 
      {/* Mensajes — patrón alternado */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        <div className="flex justify-start">
          <Skeleton className="h-10 w-48 rounded-2xl rounded-tl-sm" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-36 rounded-2xl rounded-tr-sm" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-16 w-56 rounded-2xl rounded-tl-sm" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-44 rounded-2xl rounded-tr-sm" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-10 w-40 rounded-2xl rounded-tl-sm" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-16 w-52 rounded-2xl rounded-tr-sm" />
        </div>
      </div>
 
      {/* Input */}
      <div className="flex gap-2 px-4 py-3 border-t shrink-0">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      </div>
 
    </div>
  )
}