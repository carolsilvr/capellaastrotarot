-- 1. Remove anon row-level access to bookings (PII exposure). Public agenda uses the booked_time_ranges view.
DROP POLICY IF EXISTS "bookings busy ranges anon" ON public.bookings;
REVOKE ALL ON public.bookings FROM anon;
GRANT SELECT ON public.booked_time_ranges TO anon, authenticated;

-- 2. Restrict public site_settings reads to a known allowlist of non-sensitive keys.
DROP POLICY IF EXISTS "site_settings public read" ON public.site_settings;
CREATE POLICY "site_settings public read allowlist"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (
  key IN (
    'hero_title',
    'hero_subtitle',
    'announcement_banner',
    'announcement_active',
    'contact_whatsapp',
    'contact_instagram'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);