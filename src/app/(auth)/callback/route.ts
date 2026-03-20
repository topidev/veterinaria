import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('🔵 Callback ejecutándose, code:', code ? 'existe' : 'NO existe')
  console.log('🔵 origin:', origin)
  console.log('🔵 next:', next)

  // Si no hay code en la URL, algo salió mal en el flujo de OAuth.
  // Redirigimos al login con un error visible.
  if (!code) {
    console.log('🔴 Sin code, redirigiendo a login')
    return NextResponse.redirect(
      `${origin}/login?error=missing_code`
    )
  }

  const supabase = await createClient()

  // exchangeCodeForSession hace la llamada a Supabase con el code temporal.
  // Supabase verifica el code con Google, crea la sesión y setea las cookies.
  // Todo esto ocurre en el servidor — el usuario nunca ve el code.
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  console.log('🔵 exchangeCodeForSession error:', error?.message ?? 'ninguno')

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed`
    )
  }

  // Con OAuth (Google), user_metadata no tiene 'role'.
  // Lo leemos de profiles y actualizamos el JWT para que el middleware
  // pueda leerlo en requests futuros.
  if (data.user && !data.user.user_metadata?.role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role) {
      // updateUser sincroniza el role al JWT — próximos requests
      // lo tendrán disponible en user_metadata.role
      await supabase.auth.updateUser({
        data: { role: profile.role }
      })
    }
  }

  // Sesión creada exitosamente.
  // El parámetro ?next permite redirigir al usuario a donde quería ir
  // antes de que el middleware lo mandara al login.
  // Por defecto va a /dashboard — el middleware lo redirige al sub-dashboard correcto.
  console.log('🟢 Sesión creada, redirigiendo a:', next)
  return NextResponse.redirect(`${origin}${next}`)
}