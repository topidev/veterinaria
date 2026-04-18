-- ============================================
-- VetPoint — Sprint 3 RLS Policies
-- Reservaciones, Servicios y Horarios
-- Ejecuta esto en Supabase SQL Editor
-- ============================================

-- ─── services ─────────────────────────────────────────────────────────────────

-- Todos pueden leer servicios activos (clientes al agendar, vets al ver precios)
CREATE POLICY "public_read_services" ON services
  FOR SELECT
  USING (true);

-- Solo el admin puede crear, editar y desactivar servicios
CREATE POLICY "admin_manage_services" ON services
  FOR ALL
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- ─── vet_schedules ────────────────────────────────────────────────────────────

-- Todos pueden leer horarios (clientes los ven al elegir fecha)
CREATE POLICY "public_read_schedules" ON vet_schedules
  FOR SELECT
  USING (true);

-- El vet gestiona su propio horario
CREATE POLICY "vet_manage_own_schedule" ON vet_schedules
  FOR ALL
  USING (auth.uid() = vet_id);

-- El admin gestiona los horarios de cualquier vet
CREATE POLICY "admin_manage_schedules" ON vet_schedules
  FOR ALL
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- ─── appointments ─────────────────────────────────────────────────────────────

-- El cliente ve sus propias citas
CREATE POLICY "client_own_appointments" ON appointments
  FOR SELECT
  USING (auth.uid() = client_id);

-- El vet ve las citas asignadas a él
CREATE POLICY "vet_own_appointments" ON appointments
  FOR SELECT
  USING (auth.uid() = vet_id);

-- El admin ve todas las citas
CREATE POLICY "admin_read_all_appointments" ON appointments
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- El cliente puede crear citas de tipo scheduled
CREATE POLICY "client_create_appointment" ON appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND type = 'scheduled'
  );

-- El vet puede crear walk-ins y actualizar el status de sus citas.
-- El admin puede gestionar cualquier cita.
CREATE POLICY "vet_admin_manage_appointments" ON appointments
  FOR ALL
  USING (
    auth.uid() = vet_id
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- ─── appointment_services ─────────────────────────────────────────────────────

-- Los participantes de la cita pueden leer sus servicios.
-- El admin puede leer todos.
CREATE POLICY "read_appointment_services" ON appointment_services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
      AND (
        a.client_id = auth.uid()
        OR a.vet_id  = auth.uid()
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
      )
    )
  );

-- El cliente y el vet pueden insertar servicios en sus citas.
-- El admin puede gestionar cualquiera.
CREATE POLICY "manage_appointment_services" ON appointment_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
      AND (
        a.client_id = auth.uid()
        OR a.vet_id  = auth.uid()
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
      )
    )
  );

-- ─── pets — policy adicional desbloqueada en Sprint 3 ────────────────────────
-- Ahora que existe appointments, los vets pueden leer
-- mascotas de sus pacientes para ver el historial.

CREATE POLICY "vet_read_patient_pets" ON pets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.pet_id = pets.id
      AND   appointments.vet_id = auth.uid()
    )
  );

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- SELECT policyname, tablename, cmd
-- FROM pg_policies
-- WHERE tablename IN (
--   'services', 'vet_schedules',
--   'appointments', 'appointment_services'
-- )
-- ORDER BY tablename, cmd;