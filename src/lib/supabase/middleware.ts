// src/lib/supabase/middleware.ts
//
// PARA QUÉ SIRVE:
// Helper que refresca la sesión de Supabase dentro del middleware de Next.js.
// Este archivo NO es el middleware principal — es una utilidad que importa
// el middleware principal (src/middleware.ts en la raíz de /src).
//
// POR QUÉ EXISTE SEPARADO:
// El middleware de Next.js corre en Edge Runtime. No puede usar el mismo
// cliente que los Server Components (que usa next/headers). Necesita su
// propio cliente que lea/escriba cookies directamente del NextRequest/Response.
//
// FLUJO:
// Request → middleware.ts (raíz) → updateSession() aquí → refresca JWT → continúa

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  // Nota para Junior: empezamos con NextResponse.next() que simplemente
  // deja pasar el request. Lo mutamos después si necesitamos setear cookies.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Paso 1: seteamos en el request (para que el servidor las vea)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Paso 2: recreamos el response con el request actualizado
          supabaseResponse = NextResponse.next({ request })
          // Paso 3: seteamos en el response (para que el browser las guarde)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: getUser() hace dos cosas:
  // 1. Refresca el access token si está por vencer (usando el refresh token)
  // 2. Retorna el usuario autenticado (o null si no hay sesión)
  //
  // No uses getSession() aquí — no refresca el token.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}