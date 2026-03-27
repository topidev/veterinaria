export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          id: string
          price_at_time: number
          quantity: number
          service_id: string
        }
        Insert: {
          appointment_id: string
          id?: string
          price_at_time: number
          quantity?: number
          service_id: string
        }
        Update: {
          appointment_id?: string
          id?: string
          price_at_time?: number
          quantity?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string
          created_at: string
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pet_id: string
          scheduled_date: string
          scheduled_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          subtotal: number
          total: number
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at: string
          vet_id: string
          vet_notes: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pet_id: string
          scheduled_date: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          subtotal?: number
          total?: number
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
          vet_id: string
          vet_notes?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pet_id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          subtotal?: number
          total?: number
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
          vet_id?: string
          vet_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_profiles: {
        Row: {
          address: string | null
          emergency_contact: Json | null
          id: string
          notes: string | null
          preferred_vet_id: string | null
        }
        Insert: {
          address?: string | null
          emergency_contact?: Json | null
          id: string
          notes?: string | null
          preferred_vet_id?: string | null
        }
        Update: {
          address?: string | null
          emergency_contact?: Json | null
          id?: string
          notes?: string | null
          preferred_vet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_profiles_preferred_vet_id_fkey"
            columns: ["preferred_vet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          breed: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          is_active: boolean
          is_neutered: boolean | null
          medical_notes: string | null
          name: string
          owner_id: string
          photo_url: string | null
          sex: Database["public"]["Enums"]["pet_sex"] | null
          species: Database["public"]["Enums"]["pet_species"]
          weight_kg: number | null
        }
        Insert: {
          breed?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          is_active?: boolean
          is_neutered?: boolean | null
          medical_notes?: string | null
          name: string
          owner_id: string
          photo_url?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"] | null
          species: Database["public"]["Enums"]["pet_species"]
          weight_kg?: number | null
        }
        Update: {
          breed?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          is_active?: boolean
          is_neutered?: boolean | null
          medical_notes?: string | null
          name?: string
          owner_id?: string
          photo_url?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"] | null
          species?: Database["public"]["Enums"]["pet_species"]
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          base_price: number
          category: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          base_price: number
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      vet_schedules: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          slot_duration: number
          start_time: string
          vet_id: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          slot_duration?: number
          start_time: string
          vet_id: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          slot_duration?: number
          start_time?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_schedules_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      veterinario_profiles: {
        Row: {
          bio: string | null
          consultation_fee: number | null
          id: string
          is_verified: boolean
          license_number: string | null
          specialty: string[] | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          consultation_fee?: number | null
          id: string
          is_verified?: boolean
          license_number?: string | null
          specialty?: string[] | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          consultation_fee?: number | null
          id?: string
          is_verified?: boolean
          license_number?: string | null
          specialty?: string[] | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "veterinario_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      appointment_status:
      | "pending"
      | "confirmed"
      | "in_progress"
      | "completed"
      | "cancelled"
      appointment_type: "scheduled" | "walk_in"
      payment_status: "pending" | "paid" | "refunded"
      pet_sex: "male" | "female"
      pet_species: "dog" | "cat" | "bird" | "rabbit" | "other"
      user_role: "admin" | "veterinario" | "cliente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

// Agregar al final de src/types/supabase.ts

export type Service = Tables<'services'>
export type ServiceInsert = TablesInsert<'services'>

export type VetSchedule = Tables<'vet_schedules'>
export type VetScheduleInsert = TablesInsert<'vet_schedules'>

export type Appointment = Tables<'appointments'>
export type AppointmentInsert = TablesInsert<'appointments'>
export type AppointmentUpdate = TablesUpdate<'appointments'>

export type AppointmentService = Tables<'appointment_services'>
export type AppointmentServiceInsert = TablesInsert<'appointment_services'>

// ENUMs nuevos
export type AppointmentStatus = Enums<'appointment_status'>
export type AppointmentType = Enums<'appointment_type'>
export type PaymentStatus = Enums<'payment_status'>

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      appointment_type: ["scheduled", "walk_in"],
      payment_status: ["pending", "paid", "refunded"],
      pet_sex: ["male", "female"],
      pet_species: ["dog", "cat", "bird", "rabbit", "other"],
      user_role: ["admin", "veterinario", "cliente"],
    },
  },
} as const
