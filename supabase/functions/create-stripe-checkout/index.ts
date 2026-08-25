import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bookingId, serviceId, customerName, customerEmail, successUrl, cancelUrl } =
      await req.json();

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurada nos Secrets do Supabase.");
    }

    // Buscar dados do serviço direto do banco (seguro - servidor)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("name, price_cents, duration_minutes")
      .eq("id", serviceId)
      .single();

    if (svcErr || !service) {
      throw new Error("Serviço não encontrado.");
    }

    // Criar Checkout Session no Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-06-30.basil" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      client_reference_id: bookingId,
      metadata: {
        booking_id: bookingId,
        customer_name: customerName,
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
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // Salvar stripe_session_id na reserva
    await supabase
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", bookingId);

    return new Response(
      JSON.stringify({ checkoutUrl: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
