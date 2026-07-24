import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  Instagram,
  ArrowRight,
  Sparkles,
  Calendar,
  MessageCircle,
  ChevronDown,
  Quote,
} from "lucide-react";

import heroImg from "@/assets/hero-celestial.jpg";
import tarotImg from "@/assets/method-tarot.jpg";
import astroImg from "@/assets/method-astro.jpg";
import horaImg from "@/assets/method-hora.jpg";
import acompanhamentoImg from "@/assets/method-acompanhamento.jpg";
import mentoriaImg from "@/assets/method-mentoria.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

const methods = [
  {
    slug: "tarot",
    name: "tarot",
    image: tarotImg,
    text: "os arcanos como espelho simbólico do momento presente — clareza, direção e leitura de ciclos.",
  },
  {
    slug: "mapa-astral",
    name: "mapa astral",
    image: astroImg,
    text: "o desenho do céu no instante do seu nascimento como mapa de talentos, ritmos e desafios.",
  },
  {
    slug: "hora-dedicada",
    name: "hora dedicada",
    image: horaImg,
    text: "uma hora inteira para uma questão específica — decisão profissional, relação, mudança de fase.",
  },
  {
    slug: "acompanhamento-mensal",
    name: "acompanhamento mensal",
    image: acompanhamentoImg,
    text: "quatro encontros no mês para integrar as leituras ao cotidiano, com continuidade e método.",
  },
  {
    slug: "mentorias",
    name: "mentorias",
    image: mentoriaImg,
    text: "processos mais longos, para quem quer se aprofundar no estudo simbólico com escuta e direção.",
  },
];

const benefits = [
  { title: "clareza", text: "organizar o que já está dentro de você, com menos ruído." },
  { title: "autoconhecimento", text: "compreender padrões, forças e pontos cegos." },
  { title: "decisão", text: "escolher com mais consciência, sem depender de fórmulas prontas." },
  { title: "padrões", text: "reconhecer ciclos que se repetem em amor, carreira e família." },
  { title: "desenvolvimento", text: "traduzir símbolo em prática, no seu tempo." },
];

const faqs = [
  {
    q: "o tarot prevê o futuro?",
    a: "não. o tarot é uma linguagem simbólica que ajuda a olhar o presente com mais consciência. o futuro segue sendo construído pelas suas escolhas.",
  },
  { q: "quanto tempo dura uma sessão?", a: "as consultas duram entre 60 e 90 minutos, dependendo do método escolhido." },
  { q: "é online?", a: "sim, todos os atendimentos acontecem online por videochamada, em ambiente tranquilo e privado." },
  { q: "recebo gravação?", a: "sim. você recebe a gravação da sessão e um material complementar em pdf." },
  { q: "como funciona o pagamento?", a: "pix, cartão em até 6x ou boleto. o link é enviado após a escolha do serviço." },
  { q: "posso remarcar?", a: "sim, com até 24 horas de antecedência, sem custo adicional." },
  { q: "há reembolso?", a: "até 7 dias após a compra, se ainda não houver atendimento realizado." },
];

const testimonials = [
  {
    text: "não é sobre prever nada. saí da sessão com uma clareza que meses de conversa não me deram. método, escuta e delicadeza.",
    name: "marina l.",
    role: "designer",
  },
  {
    text: "a leitura de mapa astral me ajudou a entender ciclos profissionais que eu vinha ignorando. muito mais estratégia do que mística.",
    name: "camila r.",
    role: "advogada",
  },
  {
    text: "a mentoria mudou minha relação com as decisões. hoje escolho a partir de um lugar mais firme e menos ansioso.",
    name: "beatriz s.",
    role: "empreendedora",
  },
];

function Home() {
  const [dark, setDark] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [testimonial, setTestimonial] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const id = setInterval(() => setTestimonial((t) => (t + 1) % testimonials.length), 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/60">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="#top" className="text-serif text-xl tracking-wide">
            capella<span className="text-accent">.</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#metodos" className="hover:text-foreground transition-colors">métodos</a>
            <a href="#processo" className="hover:text-foreground transition-colors">como funciona</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">depoimentos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">perguntas</a>
            <a href="#historia" className="hover:text-foreground transition-colors">minha história</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark((d) => !d)}
              aria-label="alternar modo escuro"
              className="p-2 rounded-full border border-border hover:border-accent transition-colors"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <a
              href="/agendar"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm hover:bg-primary transition-colors"
            >
              agendar
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12 gap-12 px-6 py-20 lg:py-32 items-center">
          <div className="lg:col-span-7 fade-in-up">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-8">
              <span className="inline-block h-px w-8 bg-accent" />
              tarot · astrologia · numerologia
            </div>
            <h1 className="text-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-foreground">
              autoconhecimento
              <br />
              para viver escolhas
              <br />
              <em className="text-accent not-italic">mais conscientes.</em>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
              o tarot, a astrologia e a numerologia como ferramentas para compreender ciclos,
              fortalecer decisões e desenvolver sua própria jornada.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/agendar"
                className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm hover:opacity-90 transition-all"
              >
                agendar uma leitura
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#metodos"
                className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-7 py-3.5 text-sm hover:border-foreground transition-colors"
              >
                conhecer os métodos
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 fade-in-up">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-accent/30 shadow-2xl">
              <img
                src={heroImg}
                alt="ilustração celestial renascentista com sol, lua e constelações"
                className="size-full object-cover"
                width={1600}
                height={2000}
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-accent/20 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="hairline mx-auto max-w-7xl" />
      </section>

      {/* Processo */}
      <section id="processo" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">como funciona</p>
          <h2 className="text-serif text-4xl sm:text-5xl">três passos, um encontro.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { n: "01", t: "escolha sua leitura", d: "tarot, mapa astral, numerologia, matriz ou mentoria — cada um responde a um tipo de pergunta." },
            { n: "02", t: "agende um horário", d: "calendário com fusos e horários disponíveis. você recebe a confirmação por e-mail e whatsapp." },
            { n: "03", t: "receba sua consulta online", d: "encontro por videochamada. ao final, você recebe a gravação e um material em pdf." },
          ].map((s) => (
            <div key={s.n} className="group">
              <div className="text-serif text-6xl text-accent/70 mb-6">{s.n}</div>
              <h3 className="text-serif text-2xl mb-3">{s.t}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Métodos */}
      <section id="metodos" className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">métodos</p>
              <h2 className="text-serif text-4xl sm:text-5xl">linguagens simbólicas, propósitos distintos.</h2>
            </div>
            <p className="max-w-sm text-muted-foreground">
              cada método é uma porta de entrada diferente para o mesmo trabalho: olhar para si com mais honestidade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {methods.map((m) => (
              <a
                key={m.name}
                href="/agendar"
                className="group relative overflow-hidden rounded-sm border border-border bg-card hover:border-accent transition-all duration-500"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={m.image}
                    alt={m.name}
                    loading="lazy"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-serif text-2xl">{m.name}</h3>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.text}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="mx-auto max-w-7xl px-6 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">por que fazer uma leitura</p>
            <h2 className="text-serif text-4xl sm:text-5xl leading-tight">
              não é sobre prever.
              <br />
              é sobre <em className="text-accent not-italic">compreender.</em>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              o que você leva de uma sessão é um recorte simbólico do seu momento — um material de trabalho para
              usar nas escolhas reais do seu cotidiano.
            </p>
          </div>
          <div className="lg:col-span-7">
            <ul className="divide-y divide-border border-y border-border">
              {benefits.map((b) => (
                <li key={b.title} className="py-6 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-baseline">
                  <span className="text-serif text-3xl text-accent sm:min-w-40">{b.title}</span>
                  <span className="text-muted-foreground leading-relaxed">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-6 py-28 text-center">
          <Quote className="size-8 text-accent mx-auto mb-8" />
          <div className="min-h-[200px]">
            <p key={testimonial} className="text-serif text-2xl sm:text-3xl leading-relaxed fade-in-up italic">
              "{testimonials[testimonial].text}"
            </p>
            <div className="mt-8 text-sm tracking-wide">
              <p className="text-accent">{testimonials[testimonial].name}</p>
              <p className="text-primary-foreground/60">{testimonials[testimonial].role}</p>
            </div>
          </div>
          <div className="mt-10 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonial(i)}
                aria-label={`depoimento ${i + 1}`}
                className={`h-1 transition-all ${i === testimonial ? "w-8 bg-accent" : "w-4 bg-primary-foreground/30"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* História */}
      <section id="historia" className="mx-auto max-w-7xl px-6 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5">
            <div className="aspect-[4/5] overflow-hidden rounded-sm border border-accent/30">
              <img src={mentoriaImg} alt="manuscrito antigo entre mãos" loading="lazy" className="size-full object-cover" />
            </div>
          </div>
          <div className="lg:col-span-7">
            <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">minha história</p>
            <h2 className="text-serif text-4xl sm:text-5xl leading-tight">
              sou <em className="not-italic text-accent">capella</em>, e trabalho com símbolos há mais de uma década.
            </h2>
            <div className="mt-8 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                comecei estudando astrologia como quem estuda uma língua: pela gramática. depois vieram o tarot, a
                numerologia pitagórica e, mais recentemente, a matriz do destino.
              </p>
              <p>
                não trabalho com previsões. trabalho com linguagem simbólica aplicada ao autoconhecimento — um espaço
                seguro, sério e sem sensacionalismo para quem quer se olhar com mais honestidade.
              </p>
              <p>
                cada leitura é uma conversa. você chega com uma pergunta; sai com material para as próximas escolhas.
              </p>
            </div>
            <a
              href="https://www.instagram.com/capellaastrotarot/"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm text-foreground hover:text-accent transition-colors"
            >
              <Instagram className="size-4" />
              @capellaastrotarot
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6 py-28">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">perguntas frequentes</p>
            <h2 className="text-serif text-4xl sm:text-5xl">o que costumam me perguntar.</h2>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {faqs.map((f, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full py-6 flex items-center justify-between text-left group"
                  aria-expanded={openFaq === i}
                >
                  <span className="text-serif text-xl sm:text-2xl pr-8 group-hover:text-accent transition-colors">
                    {f.q}
                  </span>
                  <ChevronDown
                    className={`size-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180 text-accent" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-500 ease-out ${
                    openFaq === i ? "grid-rows-[1fr] opacity-100 pb-6" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-muted-foreground leading-relaxed pr-12">{f.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Agendar */}
      <section id="agendar" className="mx-auto max-w-7xl px-6 py-28">
        <div className="relative overflow-hidden rounded-sm bg-primary text-primary-foreground grain">
          <div className="relative z-10 px-8 sm:px-16 py-20 text-center max-w-3xl mx-auto">
            <Sparkles className="size-6 text-accent mx-auto mb-6" />
            <h2 className="text-serif text-4xl sm:text-5xl leading-tight">
              pronta para uma
              <br />
              conversa mais consciente?
            </h2>
            <p className="mt-6 text-primary-foreground/70 leading-relaxed">
              agende sua leitura em três cliques. você escolhe o método, o horário e recebe tudo online, com gravação
              e material complementar.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <a
                href="/agendar"
                className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-8 py-4 text-sm hover:opacity-90 transition-opacity"
              >
                <Calendar className="size-4" />
                agendar agora
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-8 py-4 text-sm hover:border-primary-foreground transition-colors"
              >
                <MessageCircle className="size-4" />
                falar no whatsapp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <p className="text-serif text-2xl">capella<span className="text-accent">.</span></p>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
              tarot, astrologia e numerologia como ferramentas de reflexão e desenvolvimento pessoal.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">navegação</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#metodos" className="hover:text-accent transition-colors">métodos</a></li>
              <li><a href="#processo" className="hover:text-accent transition-colors">como funciona</a></li>
              <li><a href="#historia" className="hover:text-accent transition-colors">minha história</a></li>
              <li><a href="#faq" className="hover:text-accent transition-colors">perguntas</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">contato</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://www.instagram.com/capellaastrotarot/" target="_blank" rel="noreferrer" className="hover:text-accent transition-colors">
                  instagram
                </a>
              </li>
              <li><a href="#" className="hover:text-accent transition-colors">whatsapp</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">e-mail</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} capella astrotarot. todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-accent transition-colors">política de privacidade</a>
              <a href="#" className="hover:text-accent transition-colors">termos de uso</a>
              <a href="#" className="hover:text-accent transition-colors">lgpd</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
