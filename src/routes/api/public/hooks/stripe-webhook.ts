import { createFileRoute } from "@tanstack/react-router";
import { stripe, getStripeWebhookSecret } from "@/lib/stripe.server";

// Stripe Connect webhook — configure this URL (https://<domain>/api/public/hooks/stripe-webhook)
// in the Stripe Dashboard as a "Connect" webhook endpoint (Developers → Webhooks → "+ Add
// endpoint" → "Listen to events on Connected accounts"), subscribed to:
//   account.updated, payment_intent.succeeded, payment_intent.payment_failed
//
// This is a reconciliation safety net, not the primary path: the booking widget already
// verifies the PaymentIntent synchronously before writing the reservation (see
// reservation-payment.functions.ts), and the onboarding return page re-syncs Connect status
// directly (see stripe-connect.functions.ts). This endpoint just keeps things correct if the
// client disconnects mid-flow or a connected account's status changes later (e.g. Stripe
// requests more verification and later re-enables charges).

export const Route = createFileRoute("/api/public/hooks/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sig = request.headers.get("stripe-signature");
        const rawBody = await request.text();
        if (!sig) return new Response("Missing signature", { status: 400 });

        let event;
        try {
          event = stripe.webhooks.constructEvent(rawBody, sig, getStripeWebhookSecret());
        } catch (err) {
          console.error("[stripe-webhook] signature verification failed", err);
          return new Response("Invalid signature", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          switch (event.type) {
            case "account.updated": {
              const account = event.data.object as { id: string; charges_enabled?: boolean; details_submitted?: boolean };
              await (supabaseAdmin.from("restaurants") as any)
                .update({
                  stripe_charges_enabled: !!account.charges_enabled,
                  stripe_details_submitted: !!account.details_submitted,
                })
                .eq("stripe_account_id", account.id);
              break;
            }
            case "payment_intent.succeeded": {
              const pi = event.data.object as { id: string; amount: number };
              await (supabaseAdmin.from("reservations") as any)
                .update({ deposit_status: "paid", deposit_amount: pi.amount / 100 })
                .eq("deposit_payment_intent_id", pi.id)
                .neq("deposit_status", "paid");
              break;
            }
            case "payment_intent.payment_failed": {
              const pi = event.data.object as { id: string };
              await (supabaseAdmin.from("reservations") as any)
                .update({ deposit_status: "failed" })
                .eq("deposit_payment_intent_id", pi.id)
                .neq("deposit_status", "paid");
              break;
            }
            default:
              break;
          }
        } catch (err) {
          // Log but still 200 — Stripe retries on non-2xx, and a DB hiccup here
          // shouldn't cause an infinite retry storm for an event we did verify.
          console.error("[stripe-webhook] handler error", err);
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
