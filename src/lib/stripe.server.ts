import process from "node:process";
import Stripe from "stripe";

// Server-only Stripe client. The .server.ts suffix keeps this out of the
// client bundle — the secret key never reaches the browser.
//
// Architecture (classic Connect, not the newer v2/embedded-components path):
//   - Each restaurant gets its own Stripe Connect EXPRESS account.
//   - Onboarding happens via a hosted Account Link (redirect to Stripe,
//     then back to us) — no embedded components, no extra frontend deps.
//   - Deposits are DIRECT charges created on the connected account itself
//     (via the `stripeAccount` request option), never destination charges
//     on the platform account. The restaurant is the merchant of record;
//     100% of the deposit (minus Stripe's own processing fee) settles to
//     their own bank account. We never pass application_fee_amount.
//
// Same lazy-singleton-behind-a-Proxy pattern as supabaseAdmin in
// client.server.ts, and the same "read env inside a function, not at
// module scope" rule as config.server.ts (env binds per-request on some
// runtimes).

function createStripeClient() {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY environment variable. Add your Stripe secret key (test mode: sk_test_...) to run deposit payments.",
    );
  }
  return new Stripe(STRIPE_SECRET_KEY, {
    appInfo: { name: "SeatFlow", version: "1.0.0" },
  });
}

let _stripe: Stripe | undefined;

// Import like: import { stripe } from "@/lib/stripe.server";
export const stripe = new Proxy({} as Stripe, {
  get(_, prop, receiver) {
    if (!_stripe) _stripe = createStripeClient();
    return Reflect.get(_stripe, prop, receiver);
  },
});

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
  }
  return secret;
}
