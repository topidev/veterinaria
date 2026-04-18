-- ============================================
-- VetPoint — Sprint 5 RLS Policies
-- Mensajería en tiempo real
-- Ejecuta esto en Supabase SQL Editor
-- ============================================

-- ─── conversations ────────────────────────────────────────────────────────────

-- El cliente ve las suyas, el vet ve las asignadas + las open,
-- el admin ve todas.
CREATE POLICY "read_conversations" ON conversations
  FOR SELECT
  USING (
    auth.uid() = client_id
    OR auth.uid() = vet_id
    OR status = 'open'     -- cualquier vet puede ver tickets sin asignar
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Solo el cliente puede crear una conversación (ticket)
CREATE POLICY "client_create_conversation" ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- El vet asignado puede actualizar (tomar ticket, marcar resuelto).
-- Cualquier vet puede tomar un ticket open (vet_id es null).
-- El admin puede actualizar cualquiera.
CREATE POLICY "update_conversation" ON conversations
  FOR UPDATE
  USING (
    auth.uid() = vet_id
    OR status = 'open'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- ─── messages ──────────────────────────────────────────────────────────────────

-- Los participantes de la conversación pueden leer sus mensajes.
-- Los vets pueden leer tickets open (para decidir si tomar).
-- El admin puede leer todos.
CREATE POLICY "read_messages" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (
        c.client_id = auth.uid()
        OR c.vet_id  = auth.uid()
        OR c.status  = 'open'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
      )
    )
  );

-- Solo los participantes pueden enviar mensajes.
-- Un vet puede escribir en un ticket open al tomarlo.
-- No se puede escribir en conversaciones resueltas.
CREATE POLICY "send_message" ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (
        c.client_id = auth.uid()
        OR c.vet_id  = auth.uid()
        OR (
          c.status = 'open'
          AND (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'veterinario'
        )
      )
      AND c.status != 'resolved'
    )
  );

-- Los participantes pueden marcar mensajes como leídos.
CREATE POLICY "mark_read" ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (
        c.client_id = auth.uid()
        OR c.vet_id  = auth.uid()
      )
    )
  );

-- ─── Realtime ──────────────────────────────────────────────────────────────────
-- Requerido para que postgres_changes funcione con RLS.
-- Si ya lo corriste, estas líneas darán error — es seguro ignorarlas.

ALTER TABLE messages      REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- SELECT policyname, tablename, cmd
-- FROM pg_policies
-- WHERE tablename IN ('conversations', 'messages')
-- ORDER BY tablename, cmd;