// src/lib/supabase/server.ts
//
// PARA QUÉ SIRVE:
// Cliente de Supabase para el servidor. Lee las cookies del request
// de Next.js para recuperar la sesión del usuario sin exponer
// ninguna key secreta al browser.
//
// CUÁNDO USARLO:
// - En Server Components (page.tsx, layout.tsx sin 'use client')
// - En Server Actions ('use server')
// - En Route Handlers (app/api/.../route.ts)
//
// POR QUÉ ES ASYNC:
// En Next.js 15, cookies() retorna una Promise. Si usas Next.js 14
// o anterior, quita el await — era síncrono.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Este catch NO es un error real.
            //
            // Contexto para Junior: en un Server Component de solo lectura,
            // Next.js no permite mutar cookies (es read-only). Si intentas
            // setear una cookie desde un Server Component, lanza aquí.
            //
            // Esto está bien porque el middleware.ts ya se encargó de
            // refrescar la sesión antes de que llegáramos aquí.
            // El catch evita que la app explote por algo no crítico.
          }
        },
      },
    }
  )
}