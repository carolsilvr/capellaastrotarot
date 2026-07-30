-- Remove any broad table-level read privileges for public roles
REVOKE SELECT ON public.bookings FROM anon;
REVOKE SELECT ON public.bookings FROM authenticated;

-- Public roles may only read the scheduling columns used by the availability view
GRANT SELECT (starts_at, ends_at) ON public.bookings TO anon;
GRANT SELECT (starts_at, ends_at) ON public.bookings TO authenticated;

-- Service role (server functions) keeps full access
GRANT ALL ON public.bookings TO service_role;

-- Tighten the row policy so it is clearly scoped to busy-time visibility only
DROP POLICY IF EXISTS "bookings visible ranges via view" ON public.bookings;
CREATE POLICY "bookings busy time ranges only"
  ON public.bookings
  FOR SELECT
  TO anon, authenticated
  USING (status = ANY (ARRAY['pending'::booking_status, 'confirmed'::booking_status]));