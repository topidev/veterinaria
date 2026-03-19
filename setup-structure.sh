#!/bin/bash
# setup-structure.sh
#
# Crea toda la estructura de directorios de VetPoint con archivos .gitkeep
# para que Git trackee las carpetas vacías.
#
# USO:
#   chmod +x setup-structure.sh
#   ./setup-structure.sh
#
# Corre este script desde la RAÍZ del proyecto (donde está package.json)

echo "🐾 Creando estructura VetPoint..."

# Función helper: crea el directorio y un .gitkeep dentro
mkd() {
  mkdir -p "$1"
  # Solo crea .gitkeep si la carpeta está vacía (no sobreescribir archivos existentes)
  if [ ! "$(ls -A $1 2>/dev/null)" ]; then
    touch "$1/.gitkeep"
  fi
}

# ─── App Router ───────────────────────────────────────────────────────────────

# Grupo (auth) — rutas de autenticación, no aparecen en la URL
mkd "src/app/(auth)/login"
mkd "src/app/(auth)/register"
mkd "src/app/(auth)/forgot-password"
mkd "src/app/(auth)/reset-password"
mkd "src/app/(auth)/callback"          # OAuth callback de Supabase

# Grupo (dashboard) — rutas protegidas por middleware
mkd "src/app/(dashboard)/admin"
mkd "src/app/(dashboard)/admin/usuarios"
mkd "src/app/(dashboard)/admin/reportes"

mkd "src/app/(dashboard)/veterinario"
mkd "src/app/(dashboard)/veterinario/perfil"
mkd "src/app/(dashboard)/veterinario/agenda"

mkd "src/app/(dashboard)/cliente"
mkd "src/app/(dashboard)/cliente/mascotas"
mkd "src/app/(dashboard)/cliente/perfil"

# Módulos de negocio
mkd "src/app/reservaciones"
mkd "src/app/mensajeria"
mkd "src/app/pagos"

# API Routes
mkd "src/app/api/auth"
mkd "src/app/api/reservaciones"
mkd "src/app/api/pagos/webhook"        # Webhook de Stripe — ruta especial

# ─── Components ───────────────────────────────────────────────────────────────

mkd "src/components/ui"                # Componentes base de shadcn/ui
mkd "src/components/auth"              # LoginForm, RegisterForm, etc.
mkd "src/components/dashboard"         # Sidebar, Nav, DashboardShell
mkd "src/components/reservaciones"     # CalendarView, BookingForm
mkd "src/components/mensajeria"        # ChatWindow, MessageInput
mkd "src/components/pagos"             # CheckoutForm, PaymentHistory
mkd "src/components/mascotas"          # PetCard, PetForm
mkd "src/components/shared"            # Componentes compartidos (Avatar, Badge, etc.)

# ─── Lib ──────────────────────────────────────────────────────────────────────

mkd "src/lib/supabase"                 # client.ts, server.ts, middleware.ts (ya creados)
mkd "src/lib/stripe"                   # config de Stripe (Sprint 4)
mkd "src/lib/validations"              # schemas Zod por módulo
mkd "src/lib/utils"                    # funciones utilitarias (cn, formatDate, etc.)
mkd "src/lib/actions"                  # Server Actions organizadas por módulo
mkd "src/lib/actions/auth"
mkd "src/lib/actions/reservaciones"
mkd "src/lib/actions/pagos"

# ─── Hooks ────────────────────────────────────────────────────────────────────

mkd "src/hooks"                        # Custom hooks reutilizables (useUser, usePets, etc.)

# ─── Types ────────────────────────────────────────────────────────────────────

mkd "src/types"                        # supabase.ts ya generado, index.ts, stripe.ts

# ─── Styles ───────────────────────────────────────────────────────────────────

mkd "src/styles"                       # globals.css ya existe, aquí van módulos adicionales

# ─── Public ───────────────────────────────────────────────────────────────────

mkd "public/images"
mkd "public/icons"

echo ""
echo "✅ Estructura creada. Directorios:"
find src -type d | sort | sed 's/^/   /'
echo ""
echo "📋 Próximos pasos:"
echo "   1. Copia src/lib/supabase/client.ts, server.ts, middleware.ts"
echo "   2. Copia src/middleware.ts a la raíz de src/"
echo "   3. Copia src/lib/validations/auth.ts"
echo "   4. Copia src/types/supabase.ts"
echo "   5. Corre: npx supabase gen types typescript --project-id TU_ID > src/types/supabase.ts"