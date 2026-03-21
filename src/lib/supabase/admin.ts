// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Este cliente NUNCA va al browser — solo Server Actions y Route Handlers
// SERVICE_ROLE_KEY no tiene prefijo NEXT_PUBLIC_ por esa razón
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)