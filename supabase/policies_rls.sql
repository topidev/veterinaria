-- ============================================
-- VetPoint — Sprint 2 RLS Policies
-- Ejecuta esto en Supabase SQL Editor
-- o agrégalo a tu migration file
-- ============================================

-- ─── profiles ─────────────────────────────────────────────────────────────────

-- Cada usuario lee su propio profile + admin lee todos (sin recursión — usa JWT)
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;

CREATE POLICY "read_profiles" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Cada usuario actualiza solo su propio profile
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- El trigger handle_new_user puede insertar (SECURITY DEFINER lo maneja)
DROP POLICY IF EXISTS "service_insert_profile" ON profiles;

CREATE POLICY "insert_profile" ON profiles
  FOR INSERT
  WITH CHECK (true);

-- ─── veterinario_profiles ──────────────────────────────────────────────────────

-- El vet edita su propio perfil
DROP POLICY IF EXISTS "vet_own_profile" ON veterinario_profiles;

CREATE POLICY "vet_own_profile" ON veterinario_profiles
  FOR ALL
  USING (auth.uid() = id);

-- Clientes pueden leer perfiles de vets (para elegir al agendar cita)
DROP POLICY IF EXISTS "public_read_vet_profiles" ON veterinario_profiles;

CREATE POLICY "public_read_vet_profiles" ON veterinario_profiles
  FOR SELECT
  USING (true);

-- Admin puede leer, insertar y actualizar cualquier vet profile
DROP POLICY IF EXISTS "admin_read_vet_profiles" ON veterinario_profiles;
DROP POLICY IF EXISTS "admin_insert_vet_profiles" ON veterinario_profiles;
DROP POLICY IF EXISTS "admin_update_vet_profiles" ON veterinario_profiles;

CREATE POLICY "admin_manage_vet_profiles" ON veterinario_profiles
  FOR ALL
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- ─── cliente_profiles ──────────────────────────────────────────────────────────

-- El cliente gestiona solo su propio perfil
DROP POLICY IF EXISTS "cliente_own_profile" ON cliente_profiles;

CREATE POLICY "cliente_own_profile" ON cliente_profiles
  FOR ALL
  USING (auth.uid() = id);

-- Admin puede leer todos los perfiles de clientes
CREATE POLICY "admin_read_cliente_profiles" ON cliente_profiles
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- ─── pets ──────────────────────────────────────────────────────────────────────

-- El dueño gestiona sus mascotas
DROP POLICY IF EXISTS "owner_pets" ON pets;

CREATE POLICY "owner_pets" ON pets
  FOR ALL
  USING (auth.uid() = owner_id);

-- Vets pueden leer mascotas de sus pacientes
-- (se activa en Sprint 3 cuando exista la tabla appointments)
-- CREATE POLICY "vet_read_patient_pets" ON pets
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM appointments
--       WHERE appointments.pet_id = pets.id
--       AND appointments.vet_id = auth.uid()
--     )
--   );

-- Admin puede leer todas las mascotas
CREATE POLICY "admin_read_pets" ON pets
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- ============================================
-- VERIFICACIÓN — corre esto para confirmar
-- ============================================
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename IN ('profiles', 'veterinario_profiles', 'cliente_profiles', 'pets')
-- ORDER BY tablename, cmd;