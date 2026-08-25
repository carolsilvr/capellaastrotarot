-- ============================================================
-- PATCH: Adiciona coluna stripe_session_id na tabela bookings
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Índice para buscar facilmente pelo session_id (webhook)
CREATE INDEX IF NOT EXISTS bookings_stripe_session_id_idx
  ON public.bookings (stripe_session_id);

-- Confirma
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings' AND table_schema = 'public'
ORDER BY ordinal_position;
