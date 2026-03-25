// src/middleware.ts  ← Va en la RAÍZ de /src, no dentro de /lib
//
// PARA QUÉ SIRVE:
// Intercepta TODOS los requests antes de que lleguen a cualquier página.
// Hace dos cosas:
//   1. Refresca la sesión de Supabase (delega a updateSession)
//   2. Protege rutas: redirige si no hay sesión o si el rol no coincide
//
// DÓNDE VIVE:
// src/middleware.ts  (Next.js lo detecta automáticamente aquí)
// NO va dentro de src/lib/supabase/
//
// EDGE RUNTIME:
// Este archivo corre en el Edge Network de Vercel — antes del servidor.
// No puedes usar APIs de Node.js aquí (fs, path, etc.).
// Solo Web APIs estándar + las de Next.js.

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rutas que solo pueden ver usuarios NO autenticados
const AUTH_ROUTES = ['/login', '/register', '/forgot-password']

// Rutas que requieren autenticación (cualquier rol)
const PROTECTED_ROUTES = ['/dashboard']

const PUBLIC_ROUTES = ['/callback', '/set-password', '/reset-password']

// Rutas exclusivas por rol
const ROLE_ROUTES: Record<string, string> = {
  '/dashboard/admin': 'admin',
  '/dashboard/veterinario': 'veterinario',
  '/dashboard/cliente': 'cliente',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vas a callback? pues pasale allá te atienden
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Paso 1: Refrescar sesión y obtener usuario
  // updateSession también retorna el user para no hacer dos llamadas a Supabase
  const { supabaseResponse, user } = await updateSession(request)

  // ─── Paso 2: Si el usuario NO está autenticado ─────────────────────────────

  console.log('🔵 [1] middleware pathname:', pathname)
  console.log('🔵 [2] middleware user:', user?.id ?? 'sin usuario')

  if (!user) {
    // Si intenta acceder a una ruta protegida → redirige al login
    const isProtected = PROTECTED_ROUTES.some(route =>
      pathname.startsWith(route)
    )

    if (isProtected) {
      const loginUrl = new URL('/login', request.url)
      // Guardamos a dónde quería ir para redirigirlo después del login
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Ruta pública sin sesión → dejar pasar
    return supabaseResponse
  }


  // ─── Paso 3: Si el usuario SÍ está autenticado ────────────────────────────

  // El rol viene del JWT de Supabase — no hacemos query a DB aquí
  // (las queries a DB son lentas; el middleware debe ser ultrarrápido)
  const userRole = user.user_metadata?.role as string | undefined
  console.log('🔵 [3] middleware userRole:', userRole)

  // Si intenta ir al login/register siendo ya autenticado → redirige al dashboard
  // ─── Con sesión: bloquear rutas de auth ────────────────────────────────────
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
  if (isAuthRoute) {
    const destination = userRole ? `/dashboard/${userRole}` : '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }


  // ─── Con sesión: /dashboard genérico → sub-dashboard del rol ──────────────
  // Sin esto el usuario se queda en /dashboard sin llegar a su página real.
  if (pathname === '/dashboard') {
    const destination = userRole ? `/dashboard/${userRole}` : '/login'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // ─── Con sesión: verificar que el rol coincide con la ruta ─────────────────
  // Solo verificar rol si userRole existe
  if (userRole) {
    for (const [routePrefix, requiredRole] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(routePrefix) && userRole !== requiredRole) {
        // Tiene sesión pero el rol no coincide → redirige a SU dashboard
        const userDashboard = userRole
          ? `/dashboard/${userRole}`
          : '/dashboard'
        return NextResponse.redirect(new URL(userDashboard, request.url))
      }
    }
  }

  // Todo OK → dejar pasar con la sesión refrescada
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Aplica el middleware a TODAS las rutas EXCEPTO:
     * - _next/static  → archivos estáticos de Next.js (JS, CSS bundles)
     * - _next/image   → optimización de imágenes de Next.js
     * - favicon.ico   → ícono del browser
     * - archivos con exsztensión (imágenes, fuentes, etc.)
     *
     * Nota para Junior: sin este matcher, el middleware correría incluso
     * para descargar un .png — innecesario y más lento.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}