import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { stripe } from "@/lib/stripe.server";

// Restaurant-side Stripe Connect (Express) onboarding — classic hosted
// Account Link flow. Deposits are charged DIRECTLY on each restaurant's own
// connected account (see stripe.server.ts), so onboarding just needs to get
// the account created and its `charges_enabled` flag mirrored onto
// public.restaurants.

async function assertRestaurantManager(userId: string, restaurantId: string) {
  const { data, error } = await supabaseAdmin
    .from("restaurant_members")
    .select("role")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: not a member of this restaurant");
  return data.role;
}

function appOrigin(): string {
  // Prefer an explicit configured origin; fall back to the Lovable/Vercel
  // preview URL patterns already used elsewhere, then localhost for dev.
  return (
    process.env.APP_URL ||
    process.env.VITE_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:8080"
  );
}

// Current Connect status for the caller's restaurant (used to drive the
// "Pagamentos" section in Settings).
export const getConnectStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ restaurantId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertRestaurantManager(context.userId, data.restaurantId);
    const { data: r, error } = await (supabaseAdmin.from("restaurants") as any)
      .select("stripe_account_id, stripe_charges_enabled, stripe_details_submitted")
      .eq("id", data.restaurantId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      connected: !!r?.stripe_account_id,
      chargesEnabled: !!r?.stripe_charges_enabled,
      detailsSubmitted: !!r?.stripe_details_submitted,
    };
  });

// Create (if needed) the restaurant's Express account and return a fresh
// hosted onboarding link. Safe to call repeatedly — Stripe Account Links
// expire quickly (minutes), so the UI calls this fresh each time the user
// clicks "Conectar conta Stripe" / "Continuar configuração".
export const createConnectOnboardingLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ restaurantId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertRestaurantManager(context.userId, data.restaurantId);

    const { data: r, error } = await (supabaseAdmin.from("restaurants") as any)
      .select("id, name, stripe_account_id")
      .eq("id", data.restaurantId)
      .maybeSingle();
    if (error || !r) throw new Error(error?.message ?? "Restaurant not found");

    let accountId = r.stripe_account_id as string | null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        business_type: "company",
        business_profile: { name: r.name },
      });
      accountId = account.id;
      const { error: uErr } = await supabaseAdmin
        .from("restaurants")
        .update({ stripe_account_id: accountId } as any)
        .eq("id", r.id);
      if (uErr) throw new Error(uErr.message);
    }

    const origin = appOrigin();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/app/settings?stripe=refresh`,
      return_url: `${origin}/app/settings?stripe=return`,
      type: "account_onboarding",
    });

    return { url: link.url };
  });

// Re-syncs charges_enabled/details_submitted straight from Stripe. Called
// when the user lands back on /app/settings?stripe=return, so the UI
// reflects reality immediately instead of waiting on the account.updated
// webhook (which is the source of truth going forward, but can lag a beat).
export const refreshConnectStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ restaurantId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertRestaurantManager(context.userId, data.restaurantId);
    const { data: r, error } = await (supabaseAdmin.from("restaurants") as any)
      .select("stripe_account_id")
      .eq("id", data.restaurantId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!r?.stripe_account_id) return { connected: false, chargesEnabled: false, detailsSubmitted: false };

    const account = await stripe.accounts.retrieve(r.stripe_account_id);
    const { error: uErr } = await supabaseAdmin
      .from("restaurants")
      .update({
        stripe_charges_enabled: !!account.charges_enabled,
        stripe_details_submitted: !!account.details_submitted,
      } as any)
      .eq("id", data.restaurantId);
    if (uErr) throw new Error(uErr.message);

    return {
      connected: true,
      chargesEnabled: !!account.charges_enabled,
      detailsSubmitted: !!account.details_submitted,
    };
  });
