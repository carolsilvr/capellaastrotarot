import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CreateCheckoutSchema = z.object({
  bookingId: z.string().uuid(),
  serviceId: z.string().uuid(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CreateCheckoutInput = z.infer<typeof CreateCheckoutSchema>;

export const createStripeCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CreateCheckoutSchema.parse(data))
  .handler(async ({ data }) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || secretKey.includes("INSIRA")) {
      throw new Error(
        "A chave secreta do Stripe (STRIPE_SECRET_KEY) não está configurada no servidor. " +
        "Adicione-a nas variáveis de ambiente do seu projeto no Lovable/Vercel."
      );
    }

    // Importar Stripe dinamicamente (apenas servidor)
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2025-06-30.basil" as never });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Carregar o serviço para nome e preço (nunca confiar no cliente)
    const { data: service, error: svcErr } = await supabaseAdmin
      .from("services")
      .select("name, price_cents, duration_minutes")
      .eq("id", data.serviceId)
      .single();

    if (svcErr || !service) {
      throw new Error("Serviço não encontrado.");
    }

    // Criar a Checkout Session no Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: data.customerEmail,
      client_reference_id: data.bookingId,
      metadata: {
        booking_id: data.bookingId,
        customer_name: data.customerName,
        service_name: service.name,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: service.price_cents,
            product_data: {
              name: service.name,
              description: `Consulta online de ${service.duration_minutes} minutos — Capella AstroTarot`,
            },
          },
        },
      ],
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
    });

    if (!session.url) {
      throw new Error("Não foi possível gerar o link de pagamento. Tente novamente.");
    }

    // Salvar o session_id na reserva para webhook de confirmação posterior
    await supabaseAdmin
      .from("bookings")
      .update({ payment_reference: session.id })
      .eq("id", data.bookingId);

    return { checkoutUrl: session.url, sessionId: session.id };
  });
