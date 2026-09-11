import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import process from "node:process";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { stripe } from "@/lib/stripe.server";
import type { Database } from "@/integrations/supabase/types";

// Public (anon-callable) deposit flow for the booking widget (/book).
//
// Money flow: the deposit is a DIRECT charge on the restaurant's own
// connected Stripe account (see stripe.server.ts) — 100% of it settles to
// the restaurant, whether or not the guest shows up. The platform never
// takes a cut here; monetisation is the separate subscription in
// app.billing.tsx. We never trust client-supplied amounts: the deposit is
// always recomputed server-side from the restaurant's own configured
// default_deposit, and the reservation row is only ever written after we've
// independently verified the PaymentIntent succeeded.

// Best-effort "who is this, if anyone" — unlike requireSupabaseAuth, this
// never throws, because most callers of these two functions are anonymous
// guests. Logged-in customers still get user_id stamped on their booking.
async function getOptionalUserId(): Promise<string | null> {
  try {
    const request = getRequest();
    const authHeader = request?.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.replace("Bearer ", "");
    if (!token) return null;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;

    const anon = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anon.auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    return data.claims.sub as string;
  } catch {
    return null;
  }
}

// Cast: stripe_account_id/stripe_charges_enabled are new columns from a
// migration not yet reflected in the generated Supabase types — same
// `as any` pattern used elsewhere in this codebase for the same reason.
async function loadBookableRestaurant(restaurantId: string) {
  const { data, error } = await (supabaseAdmin.from("restaurants") as any)
    .select("id, name, currency, default_deposit, is_published, status, stripe_account_id, stripe_charges_enabled")
    .eq("id", restaurantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !data.is_published || data.status !== "approved") {
    throw new Error("This restaurant is not currently taking bookings.");
  }
  return data as {
    id: string;
    name: string;
    currency: string | null;
    default_deposit: number | null;
    is_published: boolean;
    status: string;
    stripe_account_id: string | null;
    stripe_charges_enabled: boolean;
  };
}

function computeDepositAmount(r: { default_deposit: number | null }, partySize: number) {
  const perGuest = Number(r.default_deposit ?? 0);
  if (!perGuest || perGuest <= 0) return 0;
  return Math.round(perGuest * partySize * 100) / 100;
}

// Tells the booking widget whether to show a payment step at all, and for
// how much — without exposing raw pricing config columns to anon.
export const getBookingDepositInfo = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ restaurantId: z.string().uuid(), partySize: z.number().int().min(1).max(50) }).parse(input),
  )
  .handler(async ({ data }) => {
    const r = await loadBookableRestaurant(data.restaurantId);
    const amount = computeDepositAmount(r, data.partySize);
    const required = !!r.stripe_charges_enabled && !!r.stripe_account_id && amount > 0;
    return {
      required,
      amount: required ? amount : null,
      currency: required ? (r.currency || "USD").toLowerCase() : null,
    };
  });

// Creates a PaymentIntent as a direct charge on the restaurant's connected
// account. Returns the connected account id too — Stripe.js needs it
// (loadStripe(pk, { stripeAccount: acctId })) to confirm a PaymentIntent
// that lives on a connected account rather than the platform account.
export const createDepositIntent = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ restaurantId: z.string().uuid(), partySize: z.number().int().min(1).max(50) }).parse(input),
  )
  .handler(async ({ data }) => {
    const r = await loadBookableRestaurant(data.restaurantId);
    if (!r.stripe_account_id || !r.stripe_charges_enabled) {
      throw new Error("This restaurant is not set up to take deposits right now.");
    }
    const amount = computeDepositAmount(r, data.partySize);
    if (amount <= 0) throw new Error("No deposit configured for this restaurant.");
    const currency = (r.currency || "USD").toLowerCase();

    const intent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: { restaurant_id: r.id, party_size: String(data.partySize) },
      },
      { stripeAccount: r.stripe_account_id },
    );

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      connectedAccountId: r.stripe_account_id,
      amount,
      currency,
    };
  });

// Verifies the PaymentIntent actually succeeded (never trusts the client's
// word for it), then writes the reservation via the service-role client —
// this is the only place deposit_status is ever set to 'paid'.
export const finalizeReservationWithDeposit = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        restaurantId: z.string().uuid(),
        paymentIntentId: z.string().min(1),
        guestName: z.string().min(1).max(120),
        guestPhone: z.string().max(40).optional().nullable(),
        guestEmail: z.string().email().max(160).optional().nullable(),
        partySize: z.number().int().min(1).max(50),
        reservedAtIso: z.string().min(1),
        notes: z.string().max(1000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const r = await loadBookableRestaurant(data.restaurantId);
    if (!r.stripe_account_id) throw new Error("This restaurant is not set up to take deposits.");

    const intent = await stripe.paymentIntents.retrieve(data.paymentIntentId, undefined, {
      stripeAccount: r.stripe_account_id,
    });
    if (intent.status !== "succeeded") {
      throw new Error(`Payment not completed (status: ${intent.status}). Please try again.`);
    }
    const expectedAmount = computeDepositAmount(r, data.partySize);
    if (Math.abs(intent.amount / 100 - expectedAmount) > 0.01) {
      throw new Error("Deposit amount mismatch — please restart the booking.");
    }

    const userId = await getOptionalUserId();

    const { data: reservation, error } = await supabaseAdmin
      .from("reservations")
      .insert({
        restaurant_id: r.id,
        guest_name: data.guestName,
        guest_phone: data.guestPhone || null,
        guest_email: data.guestEmail || null,
        party_size: data.partySize,
        reserved_at: data.reservedAtIso,
        notes: data.notes || null,
        status: "pending",
        source: "widget",
        user_id: userId,
        deposit_status: "paid",
        deposit_payment_intent_id: intent.id,
        deposit_amount: intent.amount / 100,
      } as any)
      .select("id")
      .single();
    if (error || !reservation) throw new Error(error?.message ?? "Failed to create reservation");

    return { reservationId: reservation.id };
  });
