import { createFileRoute } from "@tanstack/react-router";

type QueueRow = {
  id: string;
  restaurant_id: string;
  reservation_id: string | null;
  waitlist_id: string | null;
  kind: string;
  to_phone: string;
  attempts: number;
};

function render(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

function formatTime(iso: string, tz: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", { timeZone: tz, dateStyle: "short", timeStyle: "short" });
  } catch {
    return new Date(iso).toLocaleString("pt-BR");
  }
}

async function sendTwilio(from: string, to: string, body: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
  if (!LOVABLE_API_KEY || !TWILIO_API_KEY) throw new Error("Twilio not connected");

  const r = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      To: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
      Body: body,
    }),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json?.message || `Twilio ${r.status}`);
  return json as { sid?: string };
}

export const Route = createFileRoute("/api/public/hooks/whatsapp-dispatch")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: due, error } = await supabaseAdmin
          .from("message_queue")
          .select("id, restaurant_id, reservation_id, waitlist_id, kind, to_phone, attempts")
          .is("processed_at", null)
          .lte("scheduled_for", new Date().toISOString())
          .lt("attempts", 5)
          .order("scheduled_for", { ascending: true })
          .limit(50);

        if (error) return Response.json({ error: error.message }, { status: 500 });
        if (!due || due.length === 0) return Response.json({ processed: 0 });

        let ok = 0, fail = 0;
        for (const row of due as QueueRow[]) {
          try {
            const { data: rest } = await supabaseAdmin
              .from("restaurants")
              .select("name, timezone, whatsapp_enabled, whatsapp_from, offer_timeout_minutes")
              .eq("id", row.restaurant_id)
              .maybeSingle();

            if (!rest?.whatsapp_enabled || !rest.whatsapp_from) {
              await supabaseAdmin.from("message_queue").update({
                processed_at: new Date().toISOString(),
                last_error: "whatsapp disabled or no from number",
              }).eq("id", row.id);
              continue;
            }

            const { data: tpl } = await supabaseAdmin
              .from("message_templates")
              .select("body, enabled")
              .eq("restaurant_id", row.restaurant_id)
              .eq("kind", row.kind as any)
              .maybeSingle();

            if (!tpl || !tpl.enabled) {
              await supabaseAdmin.from("message_queue").update({
                processed_at: new Date().toISOString(),
                last_error: "template disabled or missing",
              }).eq("id", row.id);
              continue;
            }

            const vars: Record<string, string | number> = { restaurant: rest.name, minutes: rest.offer_timeout_minutes ?? 10 };
            if (row.reservation_id) {
              const { data: r } = await supabaseAdmin
                .from("reservations")
                .select("guest_name, party_size, reserved_at, status")
                .eq("id", row.reservation_id)
                .maybeSingle();
              if (!r || r.status === "cancelled") {
                await supabaseAdmin.from("message_queue").update({
                  processed_at: new Date().toISOString(),
                  last_error: "reservation cancelled/missing",
                }).eq("id", row.id);
                continue;
              }
              vars.guest = r.guest_name;
              vars.party = r.party_size;
              vars.time = formatTime(r.reserved_at, rest.timezone);
            } else if (row.waitlist_id) {
              const { data: w } = await supabaseAdmin
                .from("waitlist")
                .select("guest_name, party_size, status")
                .eq("id", row.waitlist_id)
                .maybeSingle();
              if (!w || w.status !== "offered") {
                await supabaseAdmin.from("message_queue").update({
                  processed_at: new Date().toISOString(),
                  last_error: "waitlist not offered",
                }).eq("id", row.id);
                continue;
              }
              vars.guest = w.guest_name;
              vars.party = w.party_size;
            }

            const body = render(tpl.body, vars);
            const res = await sendTwilio(rest.whatsapp_from, row.to_phone, body);

            await supabaseAdmin.from("message_log").insert({
              restaurant_id: row.restaurant_id,
              reservation_id: row.reservation_id,
              waitlist_id: row.waitlist_id,
              direction: "out",
              kind: row.kind as any,
              to_phone: row.to_phone,
              from_phone: rest.whatsapp_from,
              body,
              status: "sent",
              provider_sid: res.sid ?? null,
            });
            await supabaseAdmin.from("message_queue").update({
              processed_at: new Date().toISOString(),
              attempts: row.attempts + 1,
            }).eq("id", row.id);
            ok++;
          } catch (e: any) {
            fail++;
            await supabaseAdmin.from("message_queue").update({
              attempts: row.attempts + 1,
              last_error: String(e?.message ?? e).slice(0, 500),
            }).eq("id", row.id);
            await supabaseAdmin.from("message_log").insert({
              restaurant_id: row.restaurant_id,
              reservation_id: row.reservation_id,
              waitlist_id: row.waitlist_id,
              direction: "out",
              kind: row.kind as any,
              to_phone: row.to_phone,
              status: "failed",
              error: String(e?.message ?? e).slice(0, 500),
            });
          }
        }
        return Response.json({ processed: due.length, ok, fail });
      },
    },
  },
});
