
CREATE TABLE public.blog_posts (
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
CREATE INDEX blog_posts_published_at_idx ON public.blog_posts (published_at DESC);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published posts readable by everyone"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed posts
INSERT INTO public.blog_posts (slug, title, excerpt, content, category, reading_minutes, published, published_at, sort_order) VALUES
  ('tarot-nao-adivinha-tarot-revela',
   'o tarot não adivinha. o tarot revela.',
   'a diferença entre buscar respostas prontas e usar as cartas como espelho simbólico do momento presente.',
$$## o tarot não é sobre prever o futuro

quando alguém procura uma leitura pela primeira vez, quase sempre traz uma pergunta fechada: "vai dar certo?", "ele vai voltar?", "consigo esse emprego?". o tarot pode responder — mas não da forma que se espera.

as cartas não descrevem um futuro fixo. elas descrevem **o presente em profundidade** — os padrões, as escolhas em jogo, o que está maduro e o que ainda está verde. o futuro que aparece é sempre uma projeção dessas forças, não uma sentença.

## uma linguagem simbólica

os arcanos são um alfabeto de imagens que existe há mais de seiscentos anos. o mago, a sacerdotisa, a torre, a estrela — cada arcano concentra uma experiência humana universal. quando lidas em conjunto, formam frases sobre o momento presente.

## o que muda depois de uma leitura

não é a realidade que muda — é o seu ângulo sobre ela. a leitura reorganiza a informação que você já tem, torna consciente o que estava difuso, e devolve o poder da escolha para as suas mãos.

esse é o trabalho: transformar dúvida em direção, ansiedade em clareza, pergunta em pergunta melhor.$$,
   'tarot', 4, true, now() - interval '2 days', 1),

  ('o-que-o-mapa-astral-realmente-diz',
   'o que o mapa astral realmente diz sobre você',
   'para além do "sou de peixes com ascendente em virgem": o mapa como estrutura simbólica de um momento único.',
$$## você não é o seu signo solar

o signo solar — aquele que a maioria conhece — é apenas uma das doze posições que compõem um mapa astral. o mapa é um retrato do céu no instante exato do seu nascimento, visto do lugar exato onde você nasceu. dois minutos de diferença já mudam a leitura.

## o mapa como estrutura

cada planeta representa uma função psicológica: a lua fala do que te acalma, marte de como você age, vênus de como você se relaciona, mercúrio de como você pensa. cada casa representa um território da vida: trabalho, relações, casa, criatividade.

o mapa astral não determina quem você é. ele descreve a **estrutura simbólica** que você recebeu ao nascer, com seus talentos, seus ritmos naturais e seus pontos de tensão.

## quando fazer uma leitura

o mapa é útil em qualquer momento, mas é especialmente potente em **momentos de transição**: mudança de carreira, fim de ciclo, decisão importante, começo de terapia, virada de idade.

o que você recebe: uma sessão de 90 minutos, gravação e um material em pdf para revisitar.$$,
   'astrologia', 6, true, now() - interval '9 days', 2),

  ('como-integrar-a-leitura-no-cotidiano',
   'como integrar a leitura no cotidiano',
   'uma leitura potente sem integração se dissolve em uma semana. um método simples de continuidade.',
$$## o efeito de uma sessão dura pouco sem prática

toda leitura abre uma janela de clareza. e toda janela, sem manutenção, se fecha. depois de uma sessão intensa é comum voltar aos padrões antigos em poucos dias.

integração é o trabalho consciente de traduzir aquilo que foi visto simbolicamente em **ação prática no cotidiano**.

## três práticas simples

**primeiro:** escreva à mão, no dia seguinte à leitura, uma frase-síntese. algo curto, que caiba em um post-it.

**segundo:** durante duas semanas, revisite a frase todas as manhãs. sem análise nova. apenas leia.

**terceiro:** em uma folha separada, anote **uma escolha concreta por semana** alinhada com a leitura. pequena. verificável.

## quando o acompanhamento mensal ajuda

o acompanhamento mensal existe justamente para segurar esse processo. quatro encontros no mês, com escuta continuada e método, para transformar clareza em movimento real.$$,
   'reflexões', 3, true, now() - interval '20 days', 3);
