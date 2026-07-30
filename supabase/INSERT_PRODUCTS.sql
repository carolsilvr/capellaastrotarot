-- ============================================================
-- CAPELLA ASTROTAROT — INSERT DE PRODUTOS
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Limpa produtos antigos (opcional — remova a linha abaixo se quiser manter anteriores)
-- DELETE FROM services;

-- ============================================================
-- TAROT
-- ============================================================
INSERT INTO public.services (id, slug, name, short_description, price_cents, duration_minutes, active, sort_order, category)
VALUES
  (gen_random_uuid(), 'pergunta-objetiva',   'Pergunta Objetiva',         'Para você que já conhece seu problema e quer ir direto ao ponto.',                                                                                    2700,  30, true, 10, 'tarot'),
  (gen_random_uuid(), 'combo-3-perguntas',   'Combo de 3 Perguntas',      'Para você que já conhece seus problemas, no plural.',                                                                                                 6700,  60, true, 20, 'tarot'),
  (gen_random_uuid(), 'roda-da-vida',        'Roda da Vida',              'Também conhecido como mandala astrológica, é a tiragem mais completa. Abrange todas as áreas da vida, com 13 arcanos maiores. Para você que não sabe o que perguntar.', 11700, 90, true, 30, 'tarot'),
  (gen_random_uuid(), 'oraculo-do-amor',     'Oráculo do Amor',           'Para você visualizar as atitudes e sentimentos envolvidos na relação com seu mômo em 9 cartas.',                                                    5700,  60, true, 40, 'tarot'),
  (gen_random_uuid(), 'pergunta-adicional',  'Pergunta Adicional',        'Uma pergunta para aprofundar qualquer leitura já realizada.',                                                                                        1700,  15, true, 50, 'tarot'),
  (gen_random_uuid(), '1h-dedicada-tarot',   '1h Dedicada (Tarot)',       'Todinha sua por 1h, em videochamada, para te direcionar e te ajudar com suas questões.',                                                            14700, 60, true, 60, 'tarot'),
  (gen_random_uuid(), '30min-dedicado-tarot','30min Dedicado (Tarot)',    '30 minutos totalmente dedicados a você, ou como acréscimo a uma consulta já realizada.',                                                            6700,  30, true, 70, 'tarot')

ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  price_cents       = EXCLUDED.price_cents,
  duration_minutes  = EXCLUDED.duration_minutes,
  sort_order        = EXCLUDED.sort_order,
  category          = EXCLUDED.category,
  active            = true;

-- ============================================================
-- ASTROLOGIA
-- ============================================================
INSERT INTO public.services (id, slug, name, short_description, price_cents, duration_minutes, active, sort_order, category)
VALUES
  (gen_random_uuid(), 'sol-e-ascendente',          'Sol e Ascendente',             'Valor simbólico para você conhecer sua essência — Sol e Ascendente do seu mapa astral.',                                                          700,   30, true, 80,  'astrologia'),
  (gen_random_uuid(), 'mapa-solar-4-areas',         'Mapa Solar [4 Áreas]',         'Seus posicionamentos e uma análise detalhada de até 4 áreas da sua vida. Consulte o site para saber mais.',                                        9700,  60, true, 90,  'astrologia'),
  (gen_random_uuid(), 'mapa-solar-5-areas-mais',    'Mapa Solar [5 Áreas +]',       'Seus posicionamentos e uma análise detalhada de cinco ou mais áreas da sua vida. Consulte o site para saber mais.',                                12700, 90, true, 100, 'astrologia'),
  (gen_random_uuid(), '1h-dedicada-astrologia',     '1h Dedicada (Astrologia)',     'Todinha sua por 1h, em videochamada, para te direcionar e te ajudar com suas questões.',                                                           14700, 60, true, 110, 'astrologia'),
  (gen_random_uuid(), '30min-dedicado-astrologia',  '30min Dedicado (Astrologia)',  '30 minutos totalmente dedicados a você, ou como acréscimo a uma consulta já realizada.',                                                           6700,  30, true, 120, 'astrologia'),
  (gen_random_uuid(), 'analise-area-da-vida',       'Análise de Área da Vida',      'Para você que lê textos prontos na internet e não entende nada. Escolha uma área ou tema da vida para buscarmos clareza e respostas nas estrelas.', 3700,  45, true, 130, 'astrologia')

ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  price_cents       = EXCLUDED.price_cents,
  duration_minutes  = EXCLUDED.duration_minutes,
  sort_order        = EXCLUDED.sort_order,
  category          = EXCLUDED.category,
  active            = true;

-- Adiciona coluna category se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.services ADD COLUMN category TEXT NOT NULL DEFAULT 'tarot';
  END IF;
END $$;

-- Confirma
SELECT id, name, price_cents, duration_minutes, category, active, sort_order
FROM public.services
ORDER BY sort_order;
