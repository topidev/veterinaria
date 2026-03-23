// src/app/reset-password/route.ts
// Supabase redirige aquí después del email de recovery.
// Intercambia el code por sesión y manda a /set-password.
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  console.log("[getCode: ]", code)

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  console.log("[NoError]")

  const supabase = await createClient()
  console.log("[ClientCreated]")
  const { error } = await supabase.auth.exchangeCodeForSession(code)


  if (error) {
    console.log("[Error en Cliente]", error)
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }
  console.log("[Enviando a SetPassword]")
  return NextResponse.redirect(`${origin}/set-password?type=recovery`)
}