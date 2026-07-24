import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CreateBookingSchema = z.object({
  serviceId: z.string().uuid(),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email().max(200),
  customerPhone: z.string().min(8).max(40),
  customerNotes: z.string().max(2000).optional().nullable(),
  startsAtISO: z.string().datetime({ offset: true }),
  paymentMethod: z.enum(["pix", "credit_card", "two_credit_cards", "debit_card"]),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CreateBookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load service to derive duration + price server-side (never trust client)
    const { data: service, error: svcErr } = await supabaseAdmin
      .from("services")
      .select("id, duration_minutes, price_cents, active")
      .eq("id", data.serviceId)
      .maybeSingle();

    if (svcErr) throw new Error("Falha ao carregar serviço");
    if (!service || !service.active) throw new Error("Serviço indisponível");

    const startsAt = new Date(data.startsAtISO);
    const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60_000);

    // Conflict check against existing pending/confirmed bookings
    const { data: overlapping, error: overlapErr } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .in("status", ["pending", "confirmed"])
      .lt("starts_at", endsAt.toISOString())
      .gt("ends_at", startsAt.toISOString())
      .limit(1);

    if (overlapErr) throw new Error("Falha ao validar horário");
    if (overlapping && overlapping.length > 0) {
      throw new Error("Este horário acabou de ser reservado. Escolha outro.");
    }

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        service_id: service.id,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        customer_notes: data.customerNotes ?? null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        price_cents: service.price_cents,
        payment_method: data.paymentMethod,
      })
      .select("id")
      .single();

    if (insErr || !inserted) throw new Error("Não foi possível salvar sua reserva");

    return { bookingId: inserted.id };
  });
