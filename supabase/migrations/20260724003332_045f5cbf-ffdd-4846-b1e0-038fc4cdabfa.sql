
-- Services offered
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services readable by everyone" ON public.services FOR SELECT USING (active = true);

-- Weekly recurring availability windows (in America/Sao_Paulo local time)
CREATE TABLE public.availability_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
GRANT SELECT ON public.availability_rules TO anon, authenticated;
GRANT ALL ON public.availability_rules TO service_role;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability rules readable by everyone" ON public.availability_rules FOR SELECT USING (active = true);

-- Specific date blocks (vacation, personal time)
CREATE TABLE public.availability_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
GRANT SELECT ON public.availability_blocks TO anon, authenticated;
GRANT ALL ON public.availability_blocks TO service_role;
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability blocks readable by everyone" ON public.availability_blocks FOR SELECT USING (true);

-- Bookings
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'processing', 'paid', 'refunded', 'failed');
CREATE TYPE public.payment_method AS ENUM ('pix', 'credit_card', 'two_credit_cards', 'debit_card');

CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_notes TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  price_cents INTEGER NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  payment_method public.payment_method,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX bookings_starts_at_idx ON public.bookings (starts_at);
-- Only service_role reads/writes bookings directly (protects PII).
-- Anon uses the RPC `get_booked_ranges` below to see only time ranges.
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public RPC: returns only occupied time ranges (no PII) so the booking UI can
-- render availability without exposing customer data.
CREATE OR REPLACE FUNCTION public.get_booked_ranges(from_ts TIMESTAMPTZ, to_ts TIMESTAMPTZ)
RETURNS TABLE (starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT starts_at, ends_at
  FROM public.bookings
  WHERE status IN ('pending', 'confirmed')
    AND starts_at < to_ts
    AND ends_at > from_ts
$$;
GRANT EXECUTE ON FUNCTION public.get_booked_ranges(TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;

-- Seed services
INSERT INTO public.services (slug, name, short_description, long_description, duration_minutes, price_cents, sort_order) VALUES
  ('tarot', 'tarot',
   'os arcanos como espelho simbólico do momento presente — clareza, direção e leitura de ciclos.',
   'uma leitura de tarot voltada para o momento presente. usamos os arcanos como linguagem simbólica para observar padrões, ampliar consciência e apoiar decisões. você recebe a gravação da sessão e um material em pdf.',
   60, 28000, 1),
  ('mapa-astral', 'mapa astral',
   'o desenho do céu no instante do seu nascimento como mapa de talentos, ritmos e desafios.',
   'interpretação completa do seu mapa natal — planetas, casas, aspectos e ciclos ativos. um trabalho estratégico sobre a sua estrutura simbólica, útil para carreira, relações e autoconhecimento. sessão de 90 minutos com gravação e material.',
   90, 48000, 2),
  ('hora-dedicada', 'hora dedicada',
   'uma hora inteira para uma questão específica — decisão profissional, relação, mudança de fase.',
   'uma hora reservada para uma única questão, com a combinação de linguagens simbólicas mais adequada ao seu tema. ideal para momentos de decisão ou virada.',
   60, 32000, 3),
  ('acompanhamento-mensal', 'acompanhamento mensal',
   'quatro encontros no mês para integrar as leituras ao cotidiano, com continuidade e método.',
   'quatro sessões de 60 minutos ao longo de um mês, para quem quer transformar as leituras em prática — com continuidade, escuta e um método consistente de trabalho.',
   60, 120000, 4),
  ('mentorias', 'mentorias',
   'processos mais longos, para quem quer se aprofundar no estudo simbólico com escuta e direção.',
   'processos de três meses de estudo e prática, para quem deseja se aprofundar em tarot ou astrologia com acompanhamento individual. inclui bibliografia, encontros semanais e materiais complementares.',
   60, 360000, 5);

-- Seed default availability: Tue–Fri 09:00–18:00, Sat 09:00–13:00
INSERT INTO public.availability_rules (weekday, start_time, end_time) VALUES
  (2, '09:00', '18:00'),
  (3, '09:00', '18:00'),
  (4, '09:00', '18:00'),
  (5, '09:00', '18:00'),
  (6, '09:00', '13:00');
