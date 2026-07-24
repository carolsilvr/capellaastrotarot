-- ====================================================================
-- CAPELLA ASTROTAROT - SCRIPT MASTER DE CONFIGURAÇÃO DO SUPABASE
-- Execute este script no SQL Editor do Supabase para criar todo o banco!
-- ====================================================================

-- 1. ENUMS (Criados com segurança se não existirem)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'client');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('unpaid', 'processing', 'paid', 'refunded', 'failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM ('pix', 'credit_card', 'two_credit_cards', 'debit_card');
  END IF;
END $$;

-- 2. TABELA DE SERVIÇOS E SUBPRODUTOS
CREATE TABLE IF NOT EXISTS public.services (
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

-- 3. REGRAS DE DISPONIBILIDADE DA AGENDA
CREATE TABLE IF NOT EXISTS public.availability_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

-- 4. BLOQUEIOS DE HORÁRIOS
CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

-- 5. TABELA DE AGENDAMENTOS (BOOKINGS)
CREATE TABLE IF NOT EXISTS public.bookings (
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

CREATE INDEX IF NOT EXISTS bookings_starts_at_idx ON public.bookings (starts_at);

-- 6. TABELA DE BLOG POSTS
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  reading_minutes INTEGER NOT NULL DEFAULT 5,
  author_name TEXT NOT NULL DEFAULT 'capella',
  category TEXT NOT NULL DEFAULT 'reflexões',
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABELA DE PERFIS DE USUÁRIO
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABELA DE PAPÉIS (USER ROLES: CLIENT / ADMIN)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 9. TABELAS DE CMS (SITE SETTINGS, TESTIMONIALS, FAQS)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  text TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. VIEWS DE HORÁRIOS OCUPADOS (SEM EXPOR DADOS PESSOAIS DE CLIENTES)
CREATE OR REPLACE VIEW public.booked_time_ranges WITH (security_invoker = false) AS
SELECT starts_at, ends_at FROM public.bookings WHERE status IN ('pending', 'confirmed');

CREATE OR REPLACE VIEW public.public_availability_blocks WITH (security_invoker = false) AS
SELECT starts_at, ends_at FROM public.availability_blocks;

-- 11. HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- 12. PERMISSÕES DE LEITURA E POLÍTICAS DE SEGURANÇA (RLS)

-- Services: Leitura pública
GRANT SELECT ON public.services TO anon, authenticated;
DROP POLICY IF EXISTS "services readable by everyone" ON public.services;
CREATE POLICY "services readable by everyone" ON public.services FOR SELECT USING (active = true);

-- Availability Rules: Leitura pública
GRANT SELECT ON public.availability_rules TO anon, authenticated;
DROP POLICY IF EXISTS "availability rules readable by everyone" ON public.availability_rules;
CREATE POLICY "availability rules readable by everyone" ON public.availability_rules FOR SELECT USING (active = true);

-- Availability Blocks: Leitura pública via view
GRANT SELECT ON public.availability_blocks TO anon, authenticated;
DROP POLICY IF EXISTS "availability blocks readable by everyone" ON public.availability_blocks;
CREATE POLICY "availability blocks readable by everyone" ON public.availability_blocks FOR SELECT USING (true);

-- Views: Leitura pública sem dados sensíveis
GRANT SELECT ON public.booked_time_ranges TO anon, authenticated;
GRANT SELECT ON public.public_availability_blocks TO anon, authenticated;

-- Blog Posts: Leitura pública de posts publicados
GRANT SELECT ON public.blog_posts TO anon, authenticated;
DROP POLICY IF EXISTS "published posts readable by everyone" ON public.blog_posts;
CREATE POLICY "published posts readable by everyone" ON public.blog_posts FOR SELECT USING (published = true);

-- Profiles: Usuário vê o próprio perfil; Admins vêem tudo
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Roles: Usuário vê o próprio role; Admins gerenciam
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Bookings: Usuários logados vêem apenas os seus agendamentos por e-mail
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Admins: Acesso total a todas as tabelas
DROP POLICY IF EXISTS "Admins manage services" ON public.services;
CREATE POLICY "Admins manage services" ON public.services FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins manage blog_posts" ON public.blog_posts;
CREATE POLICY "Admins manage blog_posts" ON public.blog_posts FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins manage bookings" ON public.bookings;
CREATE POLICY "Admins manage bookings" ON public.bookings FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins manage site_settings" ON public.site_settings;
CREATE POLICY "Admins manage site_settings" ON public.site_settings FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins manage faqs" ON public.faqs;
CREATE POLICY "Admins manage faqs" ON public.faqs FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Site Settings, Testimonials, FAQs: Leitura pública
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT SELECT ON public.faqs TO anon, authenticated;

DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (active = true);

-- 13. TRIGGER PARA CADASTRO AUTOMÁTICO DE USUÁRIOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. SEED DE SERVIÇOS INICIAIS
INSERT INTO public.services (slug, name, short_description, long_description, duration_minutes, price_cents, sort_order) VALUES
  ('tarot', 'tarot', 'os arcanos como espelho simbólico do momento presente — clareza, direção e leitura de ciclos.', 'uma leitura de tarot voltada para o momento presente.', 60, 28000, 1),
  ('mapa-astral', 'mapa astral', 'o desenho do céu no instante do seu nascimento como mapa de talentos, ritmos e desafios.', 'interpretação completa do seu mapa natal.', 90, 48000, 2),
  ('hora-dedicada', 'hora dedicada', 'uma hora inteira para uma questão específica — decisão profissional, relação, mudança de fase.', 'uma hora reservada para uma única questão.', 60, 32000, 3),
  ('acompanhamento-mensal', 'acompanhamento mensal', 'quatro encontros no mês para integrar as leituras ao cotidiano.', 'quatro sessões de 60 minutos ao longo de um mês.', 60, 120000, 4)
ON CONFLICT (slug) DO NOTHING;

-- 15. SEED DE DISPONIBILIDADE INICIAL (Ter-Sex 09h-18h, Sáb 09h-13h)
INSERT INTO public.availability_rules (weekday, start_time, end_time) VALUES
  (2, '09:00', '18:00'), (3, '09:00', '18:00'), (4, '09:00', '18:00'), (5, '09:00', '18:00'), (6, '09:00', '13:00')
ON CONFLICT DO NOTHING;

-- 16. SEED DE CONFIGURAÇÕES INICIAIS DO CMS
INSERT INTO public.site_settings (key, value) VALUES
('hero_title', '"autoconhecimento para viver escolhas mais conscientes."'::jsonb),
('hero_subtitle', '"o tarot, a astrologia e a numerologia como ferramentas para compreender ciclos, fortalecer decisões e desenvolver sua própria jornada."'::jsonb),
('announcement_banner', '"Agenda de consultas aberta com acompanhamento mensal disponível!"'::jsonb),
('announcement_active', 'true'::jsonb),
('contact_whatsapp', '"5511999999999"'::jsonb),
('contact_instagram', '"https://instagram.com/capellaastrotarot"'::jsonb)
ON CONFLICT (key) DO NOTHING;
