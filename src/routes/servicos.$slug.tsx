import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Clock, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import tarotImg from "@/assets/method-tarot.jpg";
import astroImg from "@/assets/method-astro.jpg";
import horaImg from "@/assets/method-hora.jpg";
import acompanhamentoImg from "@/assets/method-acompanhamento.jpg";
import mentoriaImg from "@/assets/method-mentoria.jpg";

type Service = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  long_description: string | null;
  duration_minutes: number;
  price_cents: number;
};

const imageBySlug: Record<string, string> = {
  "tarot": tarotImg,
  "mapa-astral": astroImg,
  "hora-dedicada": horaImg,
  "acompanhamento-mensal": acompanhamentoImg,
  "mentorias": mentoriaImg,
};

const includesBySlug: Record<string, string[]> = {
  "tarot": [
    "sessão online por videochamada",
    "gravação da sessão para você revisitar",
    "material em pdf com os arcanos trabalhados",
    "acompanhamento por 7 dias via mensagem",
  ],
  "mapa-astral": [
    "análise completa dos planetas, casas e aspectos",
    "sessão de 90 minutos com gravação",
    "material em pdf com o mapa e as interpretações",
    "trânsitos e ciclos ativos no seu ano",
  ],
  "hora-dedicada": [
    "uma hora inteira para uma questão específica",
    "combinação de tarot e astrologia conforme o tema",
    "gravação da sessão",
    "acompanhamento por 7 dias via mensagem",
  ],
  "acompanhamento-mensal": [
    "quatro sessões de 60 minutos no mês",
    "canal aberto de mensagens entre encontros",
    "material integrador entre as sessões",
    "descontos progressivos ao continuar por mais meses",
  ],
  "mentorias": [
    "três meses de estudo e prática individual",
    "encontros semanais de 60 minutos",
    "bibliografia curada para o seu percurso",
    "materiais e exercícios entre as aulas",
  ],
};

const faqBySlug: Record<string, { q: string; a: string }[]> = {
  "tarot": [
    { q: "preciso saber alguma coisa antes?", a: "não. você chega com a sua pergunta ou apenas com o momento que está atravessando. o resto se abre na sessão." },
    { q: "posso pedir para não saber algo específico?", a: "sim. o que você não quer olhar, não é olhado. o comando é sempre seu." },
    { q: "como é entregue a gravação?", a: "envio por whatsapp em até 24 horas, junto com um pdf resumindo os arcanos trabalhados." },
  ],
  "mapa-astral": [
    { q: "preciso saber a hora exata de nascimento?", a: "sim, é essencial para o mapa ser preciso. se você não sabe, converse comigo antes: existem técnicas de retificação." },
    { q: "vale para qualquer momento da vida?", a: "sim, mas o mapa é mais potente em transições — mudança de carreira, começo de terapia, virada de idade." },
    { q: "o mapa astral determina meu destino?", a: "não. ele descreve estrutura simbólica. o que você faz com ela é a sua escolha." },
  ],
  "hora-dedicada": [
    { q: "posso levar mais de uma pergunta?", a: "a hora é desenhada em torno de uma questão central. temas próximos entram, mas o foco é único." },
    { q: "quando faz mais sentido?", a: "em momentos de decisão: aceitar uma oferta, terminar uma relação, mudar de cidade, começar um projeto." },
  ],
  "acompanhamento-mensal": [
    { q: "posso remarcar sessões dentro do mês?", a: "sim. o combinado é uma sessão por semana, mas com flexibilidade dentro do mês contratado." },
    { q: "posso continuar por mais meses?", a: "sim, e há descontos progressivos a partir do segundo mês." },
    { q: "vocês trabalham só com tarot ou também astrologia?", a: "a linguagem é escolhida conforme o seu momento — pode ser um, outro, ou os dois integrados." },
  ],
  "mentorias": [
    { q: "preciso de conhecimento prévio?", a: "não. as mentorias funcionam tanto para quem está começando quanto para quem já estuda há anos." },
    { q: "como funcionam os encontros?", a: "encontros semanais de 60 minutos, com bibliografia e exercícios entre as aulas." },
    { q: "posso escolher entre tarot ou astrologia?", a: "sim. você define o percurso principal no primeiro encontro." },
  ],
};

const serviceQuery = (slug: string) =>
  queryOptions({
    queryKey: ["service", slug],
    queryFn: async (): Promise<Service> => {
      const { data, error } = await supabase
        .from("services")
        .select("id, slug, name, short_description, long_description, duration_minutes, price_cents")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as Service;
    },
    staleTime: 60_000,
  });

export const Route = createFileRoute("/servicos/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(serviceQuery(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "serviço não encontrado — capella" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.name} — capella`;
    const desc = loaderData.short_description;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ServicePage,
  errorComponent: ({ reset }) => (
    <div className="min-h-dvh grid place-items-center text-center px-6">
      <div>
        <p className="text-muted-foreground mb-4">algo saiu do trilho.</p>
        <button onClick={() => reset()} className="text-accent underline">tentar novamente</button>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-dvh grid place-items-center text-center px-6">
      <div>
        <h1 className="text-serif text-4xl mb-3">serviço não encontrado</h1>
        <Link to="/" className="text-accent underline">voltar ao início</Link>
      </div>
    </div>
  ),
});

const currency = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ServicePage() {
  const { slug } = Route.useParams();
  const { data: service } = useSuspenseQuery(serviceQuery(slug));
  const cover = imageBySlug[slug];
  const includes = includesBySlug[slug] ?? [];
  const faq = faqBySlug[slug] ?? [];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/60">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-serif text-xl tracking-wide">
            capella<span className="text-accent">.</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
            <ArrowLeft className="size-4" /> voltar
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20">
        <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">serviço</p>
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h1 className="text-serif text-5xl sm:text-6xl leading-[1.05]">{service.name}.</h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {service.short_description}
            </p>
            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4 text-accent" /> {service.duration_minutes} minutos
              </span>
              <span className="inline-flex items-center gap-2">
                <Sparkles className="size-4 text-accent" />
                <span className="text-accent">{currency(service.price_cents)}</span>
              </span>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href={`/agendar?service=${service.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm hover:opacity-90 transition-opacity"
              >
                <Calendar className="size-4" /> agendar
              </a>
              <a
                href="#detalhes"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm hover:border-accent transition-colors"
              >
                saber mais
              </a>
            </div>
          </div>
          {cover && (
            <div className="rounded-sm overflow-hidden border border-border">
              <img src={cover} alt={service.name} className="w-full aspect-[4/5] object-cover" />
            </div>
          )}
        </div>
      </section>

      {/* Long description */}
      {service.long_description && (
        <section id="detalhes" className="border-y border-border bg-secondary/30">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">sobre este trabalho</p>
            <p className="text-serif text-2xl sm:text-3xl leading-relaxed text-foreground/90">
              {service.long_description}
            </p>
          </div>
        </section>
      )}

      {/* What's included */}
      {includes.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 py-24">
          <h2 className="text-serif text-3xl sm:text-4xl mb-10">o que está incluso.</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {includes.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-24">
            <h2 className="text-serif text-3xl sm:text-4xl mb-10">perguntas frequentes.</h2>
            <div className="divide-y divide-border">
              {faq.map((item, i) => (
                <details key={i} className="group py-5">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-base">
                    <span>{item.q}</span>
                    <span className="text-accent transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <div className="rounded-sm border border-border bg-card p-10 sm:p-14 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-accent mb-3">próximo passo</p>
          <h3 className="text-serif text-3xl sm:text-4xl mb-4">quando quiser começar, comece.</h3>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            a agenda abre horários todas as semanas. escolha o dia que faz mais sentido para você.
          </p>
          <a
            href={`/agendar?service=${service.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-8 py-3.5 text-sm hover:opacity-90 transition-opacity"
          >
            agendar {service.name} <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
