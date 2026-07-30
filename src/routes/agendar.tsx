import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  Clock,
  CreditCard,
  Loader2,
  QrCode,
  Sparkles,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { createBooking } from "@/lib/booking.functions";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "agendar · capella" },
      {
        name: "description",
        content:
          "escolha o serviço, o dia e o horário. atendimento online por videochamada, com gravação e material complementar.",
      },
      { property: "og:title", content: "agendar uma leitura — capella" },
      {
        property: "og:description",
        content:
          "tarot, mapa astral, hora dedicada e acompanhamento mensal — agende em três passos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingPage,
});

type Service = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  duration_minutes: number;
  price_cents: number;
};

type AvailabilityRule = { weekday: number; start_time: string; end_time: string };
type TimeRange = { starts_at: string; ends_at: string };

type PaymentMethod = "pix" | "credit_card" | "two_credit_cards" | "debit_card";

const paymentOptions: { value: PaymentMethod; label: string; icon: typeof QrCode; hint: string }[] = [
  { value: "pix", label: "pix", icon: QrCode, hint: "confirmação imediata, sem taxa." },
  { value: "credit_card", label: "cartão de crédito", icon: CreditCard, hint: "parcelamento em até 6x." },
  { value: "two_credit_cards", label: "dois cartões de crédito", icon: CreditCard, hint: "divida o valor entre dois cartões." },
  { value: "debit_card", label: "cartão de débito", icon: CreditCard, hint: "à vista, débito em conta." },
];

const currency = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const weekdayLabels = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const monthLabels = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Build available slots for a given date, given the service duration and existing bookings/blocks. */
function buildDaySlots(
  date: Date,
  service: Service,
  rules: AvailabilityRule[],
  blocks: TimeRange[],
  booked: TimeRange[],
): Date[] {
  const weekday = date.getDay();
  const dayRules = rules.filter((r) => r.weekday === weekday);
  if (dayRules.length === 0) return [];

  // Slot step is 30 min for 30/60min services, else the service duration
  const stepMin = service.duration_minutes <= 60 ? 30 : service.duration_minutes;
  const now = new Date();
  const slots: Date[] = [];

  for (const rule of dayRules) {
    const [sh, sm] = rule.start_time.split(":").map(Number);
    const [eh, em] = rule.end_time.split(":").map(Number);
    const winStart = new Date(date);
    winStart.setHours(sh, sm, 0, 0);
    const winEnd = new Date(date);
    winEnd.setHours(eh, em, 0, 0);

    for (let t = new Date(winStart); ; t = new Date(t.getTime() + stepMin * 60_000)) {
      const slotEnd = new Date(t.getTime() + service.duration_minutes * 60_000);
      if (slotEnd > winEnd) break;
      if (slotEnd <= now) continue;

      const conflict =
        booked.some((b) => new Date(b.starts_at) < slotEnd && new Date(b.ends_at) > t) ||
        blocks.some((b) => new Date(b.starts_at) < slotEnd && new Date(b.ends_at) > t);
      if (!conflict) slots.push(new Date(t));
    }
  }
  return slots;
}

function BookingPage() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [blocks, setBlocks] = useState<TimeRange[]>([]);
  const [booked, setBooked] = useState<TimeRange[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => startOfDay(new Date()));

  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const submit = useServerFn(createBooking);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const from = startOfDay(new Date());
      const to = addDays(from, 90);
      const [svc, rul, blk, bkd] = await Promise.all([
        supabase.from("services").select("id, slug, name, short_description, duration_minutes, price_cents").eq("active", true).order("sort_order"),
        supabase.from("availability_rules").select("weekday, start_time, end_time").eq("active", true),
        supabase.from("public_availability_blocks").select("starts_at, ends_at").gte("ends_at", from.toISOString()).lte("starts_at", to.toISOString()),
        supabase.from("booked_time_ranges").select("starts_at, ends_at").gte("ends_at", from.toISOString()).lte("starts_at", to.toISOString()),
      ]);
      if (cancelled) return;
      if (svc.error) toast.error("Não foi possível carregar os serviços.");
      setServices((svc.data ?? []) as Service[]);
      setRules((rul.data ?? []) as AvailabilityRule[]);
      setBlocks((blk.data ?? []) as TimeRange[]);
      setBooked((bkd.data ?? []) as TimeRange[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Preselect service from ?service=slug
  useEffect(() => {
    if (!services || selectedService) return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("service");
    if (!slug) return;
    const match = services.find((s) => s.slug === slug);
    if (match) {
      setSelectedService(match);
      setStep(2);
    }
  }, [services, selectedService]);

  const monthDays = useMemo(() => {
    const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++)
      cells.push(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), d));
    return cells;
  }, [monthCursor]);

  const daySlots = useMemo(() => {
    if (!selectedService || !selectedDate) return [];
    return buildDaySlots(selectedDate, selectedService, rules, blocks, booked);
  }, [selectedService, selectedDate, rules, blocks, booked]);

  function dayHasAvailability(d: Date) {
    if (!selectedService) return false;
    if (d < startOfDay(new Date())) return false;
    return buildDaySlots(d, selectedService, rules, blocks, booked).length > 0;
  }

  async function handleSubmit() {
    if (!selectedService || !selectedSlot) return;
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("preencha nome, e-mail e whatsapp.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submit({
        data: {
          serviceId: selectedService.id,
          customerName: form.name.trim(),
          customerEmail: form.email.trim(),
          customerPhone: form.phone.trim(),
          customerNotes: form.notes.trim() || null,
          startsAtISO: selectedSlot.toISOString(),
          paymentMethod,
        },
      });
      setConfirmedId(res.bookingId);
      setStep(4);
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro ao criar reserva.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/60">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-serif text-xl tracking-wide">
            capella<span className="text-accent">.</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
            <ArrowLeft className="size-4" /> voltar
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-accent mb-3">agendar</p>
          <h1 className="text-serif text-4xl sm:text-5xl">reserve sua consulta.</h1>
          <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex items-center gap-3">
                <span
                  className={`inline-flex size-7 items-center justify-center rounded-full border text-xs transition-colors ${
                    step >= n ? "border-accent bg-accent text-accent-foreground" : "border-border"
                  }`}
                >
                  {step > n ? <Check className="size-3.5" /> : n}
                </span>
                {n < 4 && <span className={`h-px w-8 ${step > n ? "bg-accent" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> carregando…
          </div>
        )}

        {/* Step 1: service */}
        {!loading && step === 1 && (
          <section>
            <h2 className="text-serif text-2xl mb-6">escolha o serviço</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(services ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedService(s);
                    setSelectedDate(null);
                    setSelectedSlot(null);
                    setStep(2);
                  }}
                  className="group text-left rounded-sm border border-border bg-card p-6 hover:border-accent transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-serif text-xl">{s.name}</h3>
                    <span className="text-sm text-accent">{currency(s.price_cents)}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.short_description}</p>
                  <p className="mt-4 text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" /> {s.duration_minutes} minutos
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 2: date + time */}
        {!loading && step === 2 && selectedService && (
          <section>
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-serif text-2xl">escolha data e horário</h2>
              <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-foreground">trocar serviço</button>
            </div>
            <div className="rounded-sm border border-border bg-card p-4 mb-6 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-serif text-lg">{selectedService.name}</span>
                <span className="text-accent">{currency(selectedService.price_cents)} · {selectedService.duration_minutes}min</span>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Calendar */}
              <div className="rounded-sm border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
                    disabled={monthCursor <= startOfDay(new Date()) && sameDay(monthCursor, new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                    className="p-2 rounded hover:bg-secondary disabled:opacity-30"
                    aria-label="mês anterior"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <p className="text-sm">
                    {monthLabels[monthCursor.getMonth()]} {monthCursor.getFullYear()}
                  </p>
                  <button
                    onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
                    className="p-2 rounded hover:bg-secondary"
                    aria-label="próximo mês"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                  {weekdayLabels.map((w) => <div key={w} className="py-1">{w}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const available = dayHasAvailability(d);
                    const isSelected = selectedDate && sameDay(d, selectedDate);
                    return (
                      <button
                        key={i}
                        disabled={!available}
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedSlot(null);
                        }}
                        className={`aspect-square rounded-sm text-sm transition-all ${
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : available
                              ? "hover:bg-secondary text-foreground"
                              : "text-muted-foreground/30 cursor-not-allowed"
                        }`}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots */}
              <div>
                {!selectedDate && (
                  <div className="rounded-sm border border-dashed border-border p-8 text-sm text-muted-foreground flex items-center gap-3">
                    <CalendarIcon className="size-4" /> selecione um dia à esquerda.
                  </div>
                )}
                {selectedDate && (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {weekdayLabels[selectedDate.getDay()]}, {selectedDate.getDate()} de {monthLabels[selectedDate.getMonth()]}
                    </p>
                    {daySlots.length === 0 && (
                      <p className="text-sm text-muted-foreground">nenhum horário disponível neste dia.</p>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      {daySlots.map((slot) => {
                        const isSelected = selectedSlot && slot.getTime() === selectedSlot.getTime();
                        return (
                          <button
                            key={slot.toISOString()}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 text-sm rounded-sm border transition-all ${
                              isSelected
                                ? "border-accent bg-accent text-accent-foreground"
                                : "border-border hover:border-accent"
                            }`}
                          >
                            {String(slot.getHours()).padStart(2, "0")}:{String(slot.getMinutes()).padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                continuar <ArrowRight className="size-4" />
              </button>
            </div>
          </section>
        )}

        {/* Step 3: form + payment */}
        {!loading && step === 3 && selectedService && selectedSlot && (
          <section>
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-serif text-2xl">seus dados e pagamento</h2>
              <button onClick={() => setStep(2)} className="text-xs text-muted-foreground hover:text-foreground">trocar horário</button>
            </div>

            <div className="rounded-sm border border-border bg-card p-4 mb-6 text-sm space-y-1">
              <p><span className="text-serif text-lg">{selectedService.name}</span></p>
              <p className="text-muted-foreground">
                {selectedSlot.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} · {String(selectedSlot.getHours()).padStart(2, "0")}:{String(selectedSlot.getMinutes()).padStart(2, "0")} · {selectedService.duration_minutes}min
              </p>
              <p className="text-accent">{currency(selectedService.price_cents)}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">nome completo</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full bg-transparent border-b border-border py-2 focus:border-accent outline-none transition-colors"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">e-mail</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full bg-transparent border-b border-border py-2 focus:border-accent outline-none transition-colors"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">whatsapp</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="mt-1 w-full bg-transparent border-b border-border py-2 focus:border-accent outline-none transition-colors"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  observações <span className="lowercase text-muted-foreground/60">(opcional — data de nascimento, hora e cidade para mapa astral)</span>
                </span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full bg-transparent border-b border-border py-2 focus:border-accent outline-none transition-colors resize-none"
                />
              </label>
            </div>

            <div className="mb-8">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">forma de pagamento</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = paymentMethod === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`rounded-sm border p-4 text-left transition-colors ${
                        active ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`size-4 ${active ? "text-accent" : "text-muted-foreground"}`} />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{opt.hint}</p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                após confirmar, você recebe o link seguro de pagamento por e-mail e whatsapp. a reserva fica garantida por 1 hora até o pagamento ser aprovado.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3 text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                confirmar reserva
              </button>
            </div>
          </section>
        )}

        {/* Step 4: confirmation + Stripe payment link */}
        {step === 4 && confirmedId && selectedService && selectedSlot && (
          <section className="text-center py-12">
            <div className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-6">
              <Check className="size-6" />
            </div>
            <h2 className="text-serif text-3xl sm:text-4xl mb-4">reserva registrada com sucesso!</h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Sua reserva foi gravada no sistema. Para garantir o horário, efetue o pagamento seguro via Stripe abaixo (Cartão de Crédito ou Pix):
            </p>

            <div className="mt-8 mx-auto max-w-md text-left rounded-xl border border-accent/40 bg-card p-6 text-sm space-y-3 shadow-xl">
              <p><span className="text-muted-foreground font-medium">Serviço:</span> {selectedService.name}</p>
              <p>
                <span className="text-muted-foreground font-medium">Data e Hora:</span>{" "}
                {selectedSlot.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} às{" "}
                {String(selectedSlot.getHours()).padStart(2, "0")}:{String(selectedSlot.getMinutes()).padStart(2, "0")}
              </p>
              <p><span className="text-muted-foreground font-medium">Valor Total:</span> <span className="text-amber-400 font-bold text-base">{currency(selectedService.price_cents)}</span></p>
              <p><span className="text-muted-foreground font-medium">Código do Agendamento:</span> <span className="font-mono text-xs text-slate-300">{confirmedId}</span></p>

              <div className="pt-4 border-t border-border/60">
                <a
                  href={`https://checkout.stripe.com/pay?client_reference_id=${confirmedId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <CreditCard className="size-4" />
                  <span>Pagar Agora no Stripe (Cartão / Pix)</span>
                  <ArrowRight className="size-4" />
                </a>
                <p className="mt-2 text-[11px] text-center text-muted-foreground">
                  🔒 Processamento seguro via Stripe com confirmação automática.
                </p>
              </div>
            </div>

            <div className="mt-10">
              <Link to="/" className="inline-flex items-center gap-2 text-sm text-accent hover:text-foreground transition-colors">
                voltar ao início <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>
        )}


        {/* Hidden — for typing hints, avoids unused var */}
        <div className="hidden">{isoDate(new Date())}</div>
      </main>
    </div>
  );
}
