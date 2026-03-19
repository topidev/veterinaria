import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Si no hay code en la URL, algo salió mal en el flujo de OAuth.
  // Redirigimos al login con un error visible.
  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=missing_code`
    )
  }

  const supabase = await createClient()

  // exchangeCodeForSession hace la llamada a Supabase con el code temporal.
  // Supabase verifica el code con Google, crea la sesión y setea las cookies.
  // Todo esto ocurre en el servidor — el usuario nunca ve el code.
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed`
    )
  }

  // Sesión creada exitosamente.
  // El parámetro ?next permite redirigir al usuario a donde quería ir
  // antes de que el middleware lo mandara al login.
  // Por defecto va a /dashboard — el middleware lo redirige al sub-dashboard correcto.
  return NextResponse.redirect(`${origin}${next}`)
}