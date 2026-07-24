
-- 1) Replace SECURITY DEFINER function with a column-restricted VIEW
DROP FUNCTION IF EXISTS public.get_booked_ranges(TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE VIEW public.booked_time_ranges AS
SELECT starts_at, ends_at
FROM public.bookings
WHERE status IN ('pending', 'confirmed');

GRANT SELECT ON public.booked_time_ranges TO anon, authenticated;

-- 2) Stop exposing availability_blocks.reason publicly.
--    Revoke direct table read and expose only starts_at/ends_at via a view.
DROP POLICY IF EXISTS "availability blocks readable by everyone" ON public.availability_blocks;
REVOKE SELECT ON public.availability_blocks FROM anon, authenticated;

CREATE OR REPLACE VIEW public.public_availability_blocks AS
SELECT starts_at, ends_at
FROM public.availability_blocks;

GRANT SELECT ON public.public_availability_blocks TO anon, authenticated;

-- 3) Explicit deny SELECT policy on bookings for anon/authenticated.
--    service_role bypasses RLS and continues to have full access.
DROP POLICY IF EXISTS "bookings not client readable" ON public.bookings;
CREATE POLICY "bookings not client readable"
  ON public.bookings
  FOR SELECT
  TO anon, authenticated
  USING (false);
