
-- Make views run with the caller's permissions (RLS applies as the querier)
ALTER VIEW public.booked_time_ranges SET (security_invoker = on);
ALTER VIEW public.public_availability_blocks SET (security_invoker = on);

-- Because security_invoker is on, the caller (anon/authenticated) needs RLS
-- allowance to read the underlying rows. Add narrow policies that only make
-- sense when read *through the views*, which project non-PII columns only.

-- bookings: anon/authenticated can only see rows that are pending/confirmed.
-- The view further restricts columns to starts_at/ends_at.
-- Note: they still have no table-level GRANT, so direct table reads are blocked;
-- the view has SELECT granted and forwards permission on those two columns.
DROP POLICY IF EXISTS "bookings visible ranges via view" ON public.bookings;
CREATE POLICY "bookings visible ranges via view"
  ON public.bookings
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('pending', 'confirmed'));

-- availability_blocks: allow reads through the view. Direct table SELECT is
-- already revoked from anon/authenticated, so the reason column stays hidden.
DROP POLICY IF EXISTS "availability blocks visible ranges via view" ON public.availability_blocks;
CREATE POLICY "availability blocks visible ranges via view"
  ON public.availability_blocks
  FOR SELECT
  TO anon, authenticated
  USING (true);
