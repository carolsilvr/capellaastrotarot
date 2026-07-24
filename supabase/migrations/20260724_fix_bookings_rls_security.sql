-- Migration: Fix Bookings RLS Security Vulnerability

-- 1. Drop the insecure policy on public.bookings that allowed reading customer PII
DROP POLICY IF EXISTS "bookings visible ranges via view" ON public.bookings;
DROP POLICY IF EXISTS "availability blocks visible ranges via view" ON public.availability_blocks;

-- 2. Set security_invoker = false on booked_time_ranges and public_availability_blocks
-- This allows anon/authenticated to safely query busy time ranges (starts_at, ends_at)
-- via the views without granting direct SELECT on sensitive columns in public.bookings or availability_blocks.
ALTER VIEW public.booked_time_ranges SET (security_invoker = false);
GRANT SELECT ON public.booked_time_ranges TO anon, authenticated;

ALTER VIEW public.public_availability_blocks SET (security_invoker = false);
GRANT SELECT ON public.public_availability_blocks TO anon, authenticated;

-- 3. Scope table-level SELECT on public.bookings so users can ONLY view their own bookings by email
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 4. Scope table-level access on public.bookings for Admins to view and manage all bookings
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
CREATE POLICY "Admins can manage all bookings"
  ON public.bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
