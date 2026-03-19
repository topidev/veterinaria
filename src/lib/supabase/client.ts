// src/lib/supabase/client.ts
//
// PARA QUÉ SIRVE:
// Cliente de Supabase para componentes con 'use client'.
// Vive en el browser — tiene acceso a localStorage y cookies del browser.
// Úsalo en Client Components para subscripciones realtime, uploads, etc.
//
// CUÁNDO USARLO:
// - En Client Components ('use client')
// - Para Supabase Realtime (mensajería, Sprint 5)
// - Para uploads a Storage desde el browser
//
// CUÁNDO NO USARLO:
// - En Server Components → usa src/lib/supabase/server.ts
// - En Server Actions → usa src/lib/supabase/server.ts
// - En middleware.ts → usa src/lib/supabase/middleware.ts

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// Nota para Junior: el genérico <Database> le dice a TypeScript exactamente
// qué tablas y columnas existen. Sin esto, supabase.from('perritos') compila
// sin error aunque 'perritos' no exista en tu DB.
//
// Los tipos se generan con:
// npx supabase gen types typescript --project-id TU_ID > src/types/supabase.ts
//
// Hasta que corras ese comando, puedes usar:
// createBrowserClient<Database>(...) donde Database = any (temporal)

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )