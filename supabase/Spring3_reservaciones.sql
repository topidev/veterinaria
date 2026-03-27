-- ============================================
-- VetPoint — Sprint 3 Migration
-- Reservaciones, Servicios y Horarios
-- Ejecuta esto en Supabase SQL Editor
-- ============================================

-- ─── ENUMs ────────────────────────────────────────────────────────────────────

CREATE TYPE appointment_status AS ENUM (
  'pending',      -- recién creada, esperando confirmación del vet
  'confirmed',    -- vet confirmó
  'in_progress',  -- el paciente está siendo atendido
  'completed',    -- cita terminada
  'cancelled'     -- cancelada por cualquiera de las partes
);

CREATE TYPE appointment_type AS ENUM (
  'scheduled',  -- agendada por el cliente con anticipación
  'walk_in'     -- llegó sin cita, registrada por vet/admin
);

CREATE TYPE payment_status AS ENUM (
  'pending',   -- no se ha pagado
  'paid',      -- pagado
  'refunded'   -- reembolsado (cancelaciones)
);

-- ─── services ─────────────────────────────────────────────────────────────────
-- Catálogo de servicios que ofrece la clínica.
-- Solo el admin puede crear/editar servicios.
-- Los clientes los ven al agendar.

CREATE TABLE services (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  description      text,
  base_price       numeric(10,2) NOT NULL CHECK (base_price >= 0),
  duration_minutes integer NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  category         text NOT NULL DEFAULT 'consulta',
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Datos iniciales — servicios comunes de una veterinaria
INSERT INTO services (name, description, base_price, duration_minutes, category) VALUES
  ('Consulta general',     'Revisión y diagnóstico general',           350.00, 30,  'consulta'),
  ('Consulta de urgencia', 'Atención inmediata por emergencia',        500.00, 45,  'consulta'),
  ('Vacuna antirrábica',   'Vacuna anual obligatoria',                 180.00, 15,  'vacuna'),
  ('Vacuna múltiple',      'Parvovirus, moquillo, hepatitis, leptospirosis', 250.00, 15, 'vacuna'),
  ('Desparasitación',      'Medicamento + aplicación',                 150.00, 15,  'vacuna'),
  ('Baño y secado',        'Baño completo con secado profesional',     200.00, 60,  'grooming'),
  ('Corte de pelo',        'Corte según estándar de raza',             250.00, 60,  'grooming'),
  ('Baño + corte',         'Servicio completo de grooming',            380.00, 90,  'grooming'),
  ('Esterilización hembra','Cirugía de ovariohisterectomía',          2500.00, 120, 'cirugia'),
  ('Castración macho',     'Orquiectomía',                            1800.00, 90,  'cirugia'),
  ('Limpieza dental',      'Ultrasonido dental bajo anestesia',       1200.00, 60,  'cirugia'),
  ('Rayos X',              'Radiografía digital',                      400.00, 20,  'otro'),
  ('Análisis de sangre',   'Biometría hemática completa',              350.00, 15,  'otro');

-- ─── vet_schedules ────────────────────────────────────────────────────────────
-- Horario semanal fijo por veterinario.
-- Un vet puede tener múltiples horarios (ej: lun-vie matutino, sáb vespertino).

CREATE TABLE vet_schedules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week      integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  -- 0 = Domingo, 1 = Lunes, 2 = Martes, 3 = Miércoles,
  -- 4 = Jueves, 5 = Viernes, 6 = Sábado
  start_time       time NOT NULL,
  end_time         time NOT NULL,
  slot_duration    integer NOT NULL DEFAULT 30 CHECK (slot_duration > 0),
  -- slot_duration: minutos por cita — define cuántos slots hay en el horario
  is_active        boolean NOT NULL DEFAULT true,
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  -- Un vet no puede tener dos horarios el mismo día
  CONSTRAINT unique_vet_day UNIQUE (vet_id, day_of_week)
);

CREATE INDEX idx_vet_schedules_vet_id ON vet_schedules(vet_id);
CREATE INDEX idx_vet_schedules_day ON vet_schedules(day_of_week);

-- ─── appointments ─────────────────────────────────────────────────────────────

CREATE TABLE appointments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL REFERENCES profiles(id),
  pet_id           uuid NOT NULL REFERENCES pets(id),
  vet_id           uuid NOT NULL REFERENCES profiles(id),
  scheduled_date   date NOT NULL,
  scheduled_time   time NOT NULL,
  status           appointment_status NOT NULL DEFAULT 'pending',
  type             appointment_type NOT NULL DEFAULT 'scheduled',
  notes            text,         -- notas del cliente al agendar
  vet_notes        text,         -- notas del vet durante/después de la cita
  subtotal         numeric(10,2) NOT NULL DEFAULT 0,
  total            numeric(10,2) NOT NULL DEFAULT 0,
  payment_status   payment_status NOT NULL DEFAULT 'pending',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at automático
CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Índices para las queries más frecuentes
CREATE INDEX idx_appointments_client_id     ON appointments(client_id);
CREATE INDEX idx_appointments_vet_id        ON appointments(vet_id);
CREATE INDEX idx_appointments_pet_id        ON appointments(pet_id);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status        ON appointments(status);

-- ─── appointment_services ─────────────────────────────────────────────────────
-- Tabla intermedia: qué servicios se realizaron en cada cita.
-- price_at_time = snapshot del precio en el momento — no cambia si el precio
-- del servicio cambia después.

CREATE TABLE appointment_services (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id     uuid NOT NULL REFERENCES services(id),
  price_at_time  numeric(10,2) NOT NULL CHECK (price_at_time >= 0),
  quantity       integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  -- Precio total de esta línea = price_at_time * quantity
  CONSTRAINT unique_service_per_appointment UNIQUE (appointment_id, service_id)
);

CREATE INDEX idx_appointment_services_appointment ON appointment_services(appointment_id);
CREATE INDEX idx_appointment_services_service     ON appointment_services(service_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_schedules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- services: todos pueden leer, solo admin puede modificar
CREATE POLICY "public_read_services" ON services
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_services" ON services
  FOR ALL
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

-- vet_schedules: público para leer (clientes ven disponibilidad)
-- el vet gestiona los suyos, admin gestiona todos
CREATE POLICY "public_read_schedules" ON vet_schedules
  FOR SELECT USING (true);

CREATE POLICY "vet_manage_own_schedule" ON vet_schedules
  FOR ALL USING (auth.uid() = vet_id);

CREATE POLICY "admin_manage_schedules" ON vet_schedules
  FOR ALL
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

-- appointments: cada quien ve las suyas
CREATE POLICY "client_own_appointments" ON appointments
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "vet_own_appointments" ON appointments
  FOR SELECT USING (auth.uid() = vet_id);

CREATE POLICY "admin_read_all_appointments" ON appointments
  FOR SELECT
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

-- Clientes pueden crear citas (scheduled)
CREATE POLICY "client_create_appointment" ON appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND type = 'scheduled'
  );

-- Vets y admins pueden crear walk_in y actualizar status
CREATE POLICY "vet_admin_manage_appointments" ON appointments
  FOR ALL
  USING (
    auth.uid() = vet_id
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- appointment_services: hereda acceso de appointments
CREATE POLICY "read_appointment_services" ON appointment_services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
      AND (
        a.client_id = auth.uid()
        OR a.vet_id = auth.uid()
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
      )
    )
  );

CREATE POLICY "manage_appointment_services" ON appointment_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
      AND (
        a.client_id = auth.uid()
        OR a.vet_id = auth.uid()
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
      )
    )
  );

-- ─── Actualizar policy de pets ──────────────────────────────────────────────
-- Ahora que existe appointments, los vets pueden leer
-- mascotas de sus pacientes (comentado en sprint2_rls.sql)

CREATE POLICY "vet_read_patient_pets" ON pets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.pet_id = pets.id
      AND appointments.vet_id = auth.uid()
    )
  );

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('services', 'vet_schedules', 'appointments', 'appointment_services')
-- ORDER BY table_name;