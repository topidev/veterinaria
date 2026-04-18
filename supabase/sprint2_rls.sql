-- 1. ENUMs primero (los necesitan las tablas)
CREATE TYPE user_role AS ENUM ('admin', 'veterinario', 'cliente');
CREATE TYPE pet_species AS ENUM ('dog', 'cat', 'bird', 'rabbit', 'other');
CREATE TYPE pet_sex AS ENUM ('male', 'female');

-- 2. profiles — extiende auth.users
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         user_role NOT NULL DEFAULT 'cliente',
  full_name    text,
  phone        text,
  avatar_url   text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 3. Trigger: crear profile al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::user_role,
      'cliente'
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Trigger: updated_at automático
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 5. Atributos extra: veterinarios
CREATE TABLE veterinario_profiles (
  id               uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  license_number   text UNIQUE,
  specialty        text[] DEFAULT '{}',
  bio              text,
  consultation_fee numeric(10,2),
  years_experience integer,
  is_verified      boolean NOT NULL DEFAULT false
);

-- 6. Atributos extra: clientes
CREATE TABLE cliente_profiles (
  id                 uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  address            text,
  emergency_contact  jsonb,
  preferred_vet_id   uuid REFERENCES profiles(id),
  notes              text
);

-- 7. Mascotas
CREATE TABLE pets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          text NOT NULL,
  species       pet_species NOT NULL,
  breed         text,
  date_of_birth date,
  weight_kg     numeric(5,2),
  sex           pet_sex,
  is_neutered   boolean DEFAULT false,
  photo_url     text,
  medical_notes text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 8. Índices útiles
CREATE INDEX idx_pets_owner_id ON pets(owner_id);
CREATE INDEX idx_pets_species  ON pets(species);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE veterinario_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets                 ENABLE ROW LEVEL SECURITY;

-- profiles: cada usuario ve y edita solo el suyo
-- admins ven todos (via service_role desde el server)
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- veterinario_profiles: el vet edita el suyo, clientes leen (para ver info del vet)
CREATE POLICY "vet_own_profile" ON veterinario_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "public_read_vet_profiles" ON veterinario_profiles
  FOR SELECT USING (true);

-- cliente_profiles: solo el cliente ve y edita el suyo
CREATE POLICY "cliente_own_profile" ON cliente_profiles
  FOR ALL USING (auth.uid() = id);

-- pets: el dueño ve y edita sus mascotas
CREATE POLICY "owner_pets" ON pets
  FOR ALL USING (auth.uid() = owner_id);







-- ============================================
-- VetPoint — Fix Sprint 0: trigger handle_new_user
-- Corre esto en Supabase → SQL Editor
-- ============================================

-- 1. Función que crea el profile cuando Supabase registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER                  -- corre con permisos del owner, no del usuario
SET search_path = public           -- evita ataques de search_path hijacking
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    -- Intenta leer full_name del metadata (viene del signUp options.data)
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    -- Rol: lee del metadata si existe, sino 'cliente' por defecto
    -- COALESCE maneja tanto null como el caso donde el campo no existe
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::user_role,
      'cliente'::user_role
    ),
    -- Teléfono opcional
    NULLIF(NEW.raw_user_meta_data ->> 'phone', '')
  );
  RETURN NEW;
END;
$$;

-- 2. Trigger que dispara la función después de cada INSERT en auth.users
--    DROP IF EXISTS primero para evitar error si ya existe una versión rota
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3. Función para updated_at automático en profiles
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- VERIFICACIÓN — corre esto después para confirmar
-- ============================================
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name IN ('on_auth_user_created', 'profiles_updated_at');
--
-- Deberías ver 2 filas. Si ves 2, el trigger está activo.
-- ============================================


DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;

CREATE POLICY "read_profiles" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );



-- Admin puede actualizar cualquier veterinario_profile
CREATE POLICY "admin_update_vet_profiles" ON veterinario_profiles
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin puede insertar veterinario_profiles (para cuando el vet no tiene perfil aún)
CREATE POLICY "admin_insert_vet_profiles" ON veterinario_profiles
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin puede leer todos los veterinario_profiles
CREATE POLICY "admin_read_vet_profiles" ON veterinario_profiles
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );