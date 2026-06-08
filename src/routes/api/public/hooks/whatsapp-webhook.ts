import { createFileRoute } from "@tanstack/react-router";

function twiml(body?: string) {
  const xml = body
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${body
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response/>`;
  return new Response(xml, { status: 200, headers: { "Content-Type": "text/xml" } });
}

function normalize(p: string) {
  return p.replace(/^whatsapp:/i, "").replace(/[^\d+]/g, "");
}

export const Route = createFileRoute("/api/public/hooks/whatsapp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let from = "", body = "", to = "";
        const ct = request.headers.get("content-type") ?? "";
        if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
          const f = await request.formData();
          from = String(f.get("From") ?? "");
          to   = String(f.get("To") ?? "");
          body = String(f.get("Body") ?? "");
        } else {
          const j = await request.json().catch(() => ({} as any));
          from = j.From ?? j.from ?? ""; to = j.To ?? j.to ?? ""; body = j.Body ?? j.body ?? "";
        }

        const phone = normalize(from);
        const text = body.trim().toUpperCase();
        if (!phone) return twiml();

        // Find restaurant by matching "To" (whatsapp_from) — fallback to any restaurant with this guest
        const toNorm = normalize(to);
        const { data: rest } = await supabaseAdmin
          .from("restaurants")
          .select("id, name")
          .or(`whatsapp_from.eq.${toNorm},whatsapp_from.eq.+${toNorm}`)
          .maybeSingle();

        // Find most recent active reservation for this phone (last 7 days, future or recent)
        const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
        const q = supabaseAdmin
          .from("reservations")
          .select("id, restaurant_id, status, guest_name")
          .gte("reserved_at", since)
          .in("status", ["pending", "confirmed"])
          .or(`guest_phone.eq.${phone},guest_phone.eq.+${phone}`)
          .order("reserved_at", { ascending: true })
          .limit(1);
        if (rest?.id) q.eq("restaurant_id", rest.id);
        const { data: rrows } = await q;
        const reservation = rrows?.[0];

        const restaurantId = reservation?.restaurant_id ?? rest?.id;
        if (restaurantId) {
          await supabaseAdmin.from("message_log").insert({
            restaurant_id: restaurantId,
            reservation_id: reservation?.id ?? null,
            direction: "in",
            from_phone: phone,
            to_phone: toNorm,
            body,
            status: "received",
          });
        }

        if (!reservation) return twiml("Não encontramos uma reserva ativa para este número.");

        let replyKind: "reply_confirmed" | "reply_cancelled" | null = null;
        if (/\b(CONFIRMAR|CONFIRMO|SIM|YES)\b/.test(text)) {
          await supabaseAdmin.from("reservations").update({ status: "confirmed" as any }).eq("id", reservation.id);
          replyKind = "reply_confirmed";
        } else if (/\b(CANCELAR|CANCEL|NÃO|NAO|NO)\b/.test(text)) {
          await supabaseAdmin.from("reservations").update({ status: "cancelled" as any }).eq("id", reservation.id);
          replyKind = "reply_cancelled";
        }

        if (!replyKind) return twiml("Responda CONFIRMAR ou CANCELAR.");

        const { data: tpl } = await supabaseAdmin
          .from("message_templates")
          .select("body, enabled")
          .eq("restaurant_id", reservation.restaurant_id)
          .eq("kind", replyKind)
          .maybeSingle();

        const replyBody = (tpl?.enabled && tpl?.body)
          ? tpl.body.replace(/\{\{guest\}\}/g, reservation.guest_name).replace(/\{\{restaurant\}\}/g, rest?.name ?? "")
          : (replyKind === "reply_confirmed" ? "Obrigado! Sua reserva está confirmada." : "Sua reserva foi cancelada.");

        await supabaseAdmin.from("message_log").insert({
          restaurant_id: reservation.restaurant_id,
          reservation_id: reservation.id,
          direction: "out",
          kind: replyKind,
          to_phone: phone,
          from_phone: toNorm,
          body: replyBody,
          status: "sent",
        });

        return twiml(replyBody);
      },
    },
  },
});
