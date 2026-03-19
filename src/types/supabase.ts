// src/types/supabase.ts
//
// ⚠️  ESTE ARCHIVO ES UN PLACEHOLDER TEMPORAL
//
// Los tipos reales se generan automáticamente desde tu base de datos con:
//
//   npx supabase login
//   npx supabase gen types typescript \
//     --project-id TU_PROJECT_ID \
//     --schema public \
//     > src/types/supabase.ts
//
// Tu Project ID está en: supabase.com → tu proyecto → Settings → API
//
// Una vez generado, este archivo tendrá todas tus tablas, columnas,
// ENUMs y relaciones como tipos de TypeScript. Ejemplo de lo que verás:
//
//   export type Database = {
//     public: {
//       Tables: {
//         profiles: {
//           Row: { id: string; role: 'admin' | 'veterinario' | 'cliente'; ... }
//           Insert: { id: string; role?: 'admin' | ... }
//           Update: { id?: string; role?: 'admin' | ... }
//         }
//         pets: { Row: { ... }, Insert: { ... }, Update: { ... } }
//       }
//     }
//   }
//
// Mientras tanto, este placeholder evita errores de compilación.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'veterinario' | 'cliente'
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'veterinario' | 'cliente'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: 'admin' | 'veterinario' | 'cliente'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      veterinario_profiles: {
        Row: {
          id: string
          license_number: string | null
          specialty: string[]
          bio: string | null
          consultation_fee: number | null
          years_experience: number | null
          is_verified: boolean
        }
        Insert: {
          id: string
          license_number?: string | null
          specialty?: string[]
          bio?: string | null
          consultation_fee?: number | null
          years_experience?: number | null
          is_verified?: boolean
        }
        Update: {
          license_number?: string | null
          specialty?: string[]
          bio?: string | null
          consultation_fee?: number | null
          years_experience?: number | null
          is_verified?: boolean
        }
      }
      cliente_profiles: {
        Row: {
          id: string
          address: string | null
          emergency_contact: { name: string; phone: string; relation: string } | null
          preferred_vet_id: string | null
          notes: string | null
        }
        Insert: {
          id: string
          address?: string | null
          emergency_contact?: { name: string; phone: string; relation: string } | null
          preferred_vet_id?: string | null
          notes?: string | null
        }
        Update: {
          address?: string | null
          emergency_contact?: { name: string; phone: string; relation: string } | null
          preferred_vet_id?: string | null
          notes?: string | null
        }
      }
      pets: {
        Row: {
          id: string
          owner_id: string
          name: string
          species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
          breed: string | null
          date_of_birth: string | null
          weight_kg: number | null
          sex: 'male' | 'female' | null
          is_neutered: boolean
          photo_url: string | null
          medical_notes: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
          breed?: string | null
          date_of_birth?: string | null
          weight_kg?: number | null
          sex?: 'male' | 'female' | null
          is_neutered?: boolean
          photo_url?: string | null
          medical_notes?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          species?: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
          breed?: string | null
          date_of_birth?: string | null
          weight_kg?: number | null
          sex?: 'male' | 'female' | null
          is_neutered?: boolean
          photo_url?: string | null
          medical_notes?: string | null
          is_active?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'admin' | 'veterinario' | 'cliente'
      pet_species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
      pet_sex: 'male' | 'female'
    }
  }
}

// Helper types para no escribir Database['public']['Tables']['profiles']['Row'] cada vez
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type VetProfile = Database['public']['Tables']['veterinario_profiles']['Row']
export type ClienteProfile = Database['public']['Tables']['cliente_profiles']['Row']

export type Pet = Database['public']['Tables']['pets']['Row']
export type PetInsert = Database['public']['Tables']['pets']['Insert']
export type PetUpdate = Database['public']['Tables']['pets']['Update']

export type UserRole = Database['public']['Enums']['user_role']
export type PetSpecies = Database['public']['Enums']['pet_species']
export type PetSex = Database['public']['Enums']['pet_sex']