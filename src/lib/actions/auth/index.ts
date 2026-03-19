'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  type LoginFormData,
  type RegisterFormData,
  type ForgotPasswordFormData,
} from '@/lib/validations/auth'

// Tipo de retorno estándar para todas las actions que pueden fallar.
// Si la action tiene éxito hace redirect() — nunca retorna { success }.
// Si falla retorna { error: string } para que el form lo muestre.
type ActionResult = { error: string } | void

// ─── Login con email/password ──────────────────────────────────────────────────

export async function login(data: LoginFormData): Promise<ActionResult> {
  // Paso 1: Re-validar en el servidor aunque el form ya validó en el cliente.
  // Nunca confíes únicamente en la validación del browser — se puede bypassear.
  const parsed = loginSchema.safeParse(data)

  if (!parsed.success) {
    return { error: 'Datos inválidos. Verifica el formulario.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Supabase retorna mensajes en inglés — los mapeamos a español.
    // No exponemos el mensaje original por seguridad (no queremos decir
    // "el email no existe" vs "la contraseña es incorrecta" — eso es info
    // que un atacante puede usar para enumerar usuarios válidos).
    if (error.message === 'Email not confirmed') {
      return { error: 'Confirma tu correo antes de iniciar sesión.' }
    }
    return { error: 'Correo o contraseña incorrectos.' }
  }

  // redirect() lanza una excepción internamente en Next.js — no es un return.
  // Por eso va fuera del try/catch y al final: si llegamos aquí, todo salió bien.
  redirect('/dashboard')
}

// ─── Registro ──────────────────────────────────────────────────────────────────

export async function register(dato: RegisterFormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(dato)

  if (!parsed.success) {
    return { error: 'Datos inválidos. Verifica el formulario.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback`,
      data: {
        full_name: parsed.data.full_name,
        role: 'cliente', // siempre cliente — los vets entran por invitación del admin
        phone: parsed.data.phone ?? null,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Ya existe una cuenta con este correo.' }
    }
    return { error: 'Error al crear la cuenta. Intenta de nuevo.' }
  }

  // data.session existe → confirmación desactivada, usuario ya autenticado
  // data.session es null → esperando confirmación por email
  if (data.session) {
    redirect('/dashboard')
  } else {
    redirect(`/login?message=check_email&email=${encodeURIComponent(parsed.data.email)}`)
  }
}

// ─── Logout ────────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Después de cerrar sesión, el middleware bloqueará cualquier ruta protegida.
  // Mandamos al login directamente.
  redirect('/login')
}

// ─── Login con Google (OAuth) ──────────────────────────────────────────────────

export async function loginWithGoogle(): Promise<ActionResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Esta es la URL a la que Google redirigirá después de autenticar.
      // Tiene que coincidir exactamente con lo que registraste en
      // Supabase → Authentication → URL Configuration → Redirect URLs.
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback`,
      queryParams: {
        // Fuerza a Google a mostrar el selector de cuenta siempre.
        // Sin esto, si el usuario tiene una sola cuenta Google,
        // se loguea automáticamente sin que pueda elegir otra.
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    return { error: 'Error al conectar con Google. Intenta de nuevo.' }
  }

  // OAuth no hace redirect() de Next.js — retorna una URL de Google
  // a la que hay que mandar al usuario. El redirect lo maneja el browser.
  // Esta URL sale del servidor hacia el cliente, que lo ejecutará.
  redirect(data.url)
}

// ─── Recuperación de contraseña ────────────────────────────────────────────────

export async function forgotPassword(data: ForgotPasswordFormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(data)

  if (!parsed.success) {
    return { error: 'Ingresa un correo válido.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  })

  if (error) {
    return { error: 'Error al enviar el correo. Intenta de nuevo.' }
  }

  // Siempre redirigimos con el mismo mensaje aunque el email no exista.
  // Confirmar si un email existe o no es un riesgo de seguridad (user enumeration).
  redirect('/forgot-password?message=email_sent')
}

// ─── Reenviar email de confirmación ────────────────────────────────────────────

export async function resendConfirmation(email: string): Promise<ActionResult> {
  if (!email || !email.includes('@')) {
    return { error: 'Email inválido.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback`,
    },
  })

  if (error) {
    // Rate limit de Supabase — no exponemos el mensaje exacto
    return { error: 'Espera un momento antes de volver a intentarlo.' }
  }
}