import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CalendarPlus, MapPin, Users, Clock, X, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/cliente/")({
  head: () => ({ meta: [{ title: "Minhas reservas — SeatFlow" }] }),
  component: ClienteHome,
});

type ReviewRow = { id: string; reservation_id: string; rating: number; comment: string | null };

type Reservation = {
  id: string;
  reserved_at: string;
  party_size: number;
  status: string;
  guest_name: string;
  notes: string | null;
  deposit_status: string | null;
  deposit_amount: number | null;
  restaurant: { id: string; name: string; slug: string | null; address: string | null } | null;
};

function ClienteHome() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cliente-reservations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, reserved_at, party_size, status, guest_name, notes, deposit_status, deposit_amount, restaurant:restaurants(id, name, slug, address)")
        .eq("user_id", user!.id)
        .order("reserved_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Reservation[];
    },
  });

  // Fetched separately (rather than embedded in the query above) so that an older
  // deployment without the reviews table/migration yet applied degrades to "no
  // reviews shown" instead of a 400 breaking the entire reservation list.
  const completedIds = (data ?? []).filter((r) => r.status === "completed").map((r) => r.id);
  const { data: reviewRows } = useQuery({
    queryKey: ["cliente-reviews", completedIds],
    enabled: completedIds.length > 0,
    queryFn: async () => {
      const { data: rows, error } = await (supabase as any)
        .from("reviews")
        .select("id, reservation_id, rating, comment")
        .in("reservation_id", completedIds);
      if (error) throw error;
      return (rows ?? []) as ReviewRow[];
    },
  });
  const reviewsByReservation = new Map((reviewRows ?? []).map((rv) => [rv.reservation_id, rv]));

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva cancelada");
      qc.invalidateQueries({ queryKey: ["cliente-reservations"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const now = Date.now();
  const upcoming = (data ?? []).filter((r) => new Date(r.reserved_at).getTime() >= now && r.status !== "cancelled" && r.status !== "no_show");
  const past = (data ?? []).filter((r) => !upcoming.includes(r));

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-3">Área do cliente</p>
          <h1 className="font-serif text-4xl md:text-5xl italic">Suas reservas</h1>
          <p className="text-muted-foreground mt-2 text-sm">Todas as suas mesas — passadas e futuras — em um só lugar.</p>
        </div>
        <Link to="/restaurants" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90">
          <CalendarPlus className="size-4" /> Nova reserva
        </Link>
      </div>

      {isLoading ? (
        <div className="py-16 grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Section title="Próximas" empty="Nenhuma reserva futura." items={upcoming} onCancel={(id) => cancel.mutate(id)} />
          <Section title="Histórico" empty="Sem histórico ainda." items={past} allowReview reviewsByReservation={reviewsByReservation} />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  empty,
  onCancel,
  allowReview,
  reviewsByReservation,
}: {
  title: string;
  items: Reservation[];
  empty: string;
  onCancel?: (id: string) => void;
  allowReview?: boolean;
  reviewsByReservation?: Map<string, ReviewRow>;
}) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium truncate">{r.restaurant?.name ?? "Restaurante"}</h3>
                  <StatusPill status={r.status} />
                  <DepositPill status={r.deposit_status} amount={r.deposit_amount} />
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" />{format(new Date(r.reserved_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}</span>
                  <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />{r.party_size} pessoas</span>
                  {r.restaurant?.address && (
                    <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{r.restaurant.address}</span>
                  )}
                </div>
                {r.notes && <p className="text-xs text-muted-foreground mt-2">"{r.notes}"</p>}
                {allowReview && r.status === "completed" && r.restaurant && (
                  <ReviewControl reservationId={r.id} restaurantId={r.restaurant.id} existing={reviewsByReservation?.get(r.id) ?? null} />
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.restaurant?.slug && (
                  <Link
                    to="/r/$slug"
                    params={{ slug: r.restaurant.slug }}
                    className="h-9 inline-flex items-center px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium"
                  >
                    Ver restaurante
                  </Link>
                )}
                {onCancel && (
                  <button
                    onClick={() => { if (confirm("Cancelar esta reserva?")) onCancel(r.id); }}
                    className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg border border-border bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-xs font-medium"
                  >
                    <X className="size-3.5" /> Cancelar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewControl({ reservationId, restaurantId, existing }: { reservationId: string; restaurantId: string; existing: ReviewRow | null }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const reviewsTbl = (supabase as any).from("reviews");
      const { error } = existing
        ? await reviewsTbl.update({ rating, comment: comment.trim() || null }).eq("id", existing.id)
        : await reviewsTbl.insert({
            reservation_id: reservationId,
            restaurant_id: restaurantId,
            user_id: user.id,
            rating,
            comment: comment.trim() || null,
          });
      if (error) throw error;
      toast.success("Avaliação enviada — obrigado!");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["cliente-reviews"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Não foi possível enviar sua avaliação");
    } finally {
      setBusy(false);
    }
  };

  if (!open && existing) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <div className="inline-flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`size-3.5 ${n <= existing.rating ? "fill-accent text-accent" : "text-border"}`} />
          ))}
        </div>
        {existing.comment && <p className="text-xs text-muted-foreground italic truncate">"{existing.comment}"</p>}
        <button onClick={() => setOpen(true)} className="text-xs text-muted-foreground underline hover:text-foreground shrink-0">
          Editar
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
      >
        <Star className="size-3.5" /> Deixar avaliação verificada
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3 space-y-2">
      <div className="inline-flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)}>
            <Star className={`size-5 ${n <= rating ? "fill-accent text-accent" : "text-border"}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Como foi a experiência? (opcional)"
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="h-8 px-3 rounded-lg bg-foreground text-background text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Enviar"}
        </button>
        <button onClick={() => setOpen(false)} className="h-8 px-3 rounded-lg border border-border text-xs font-medium">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendente", cls: "bg-muted text-muted-foreground" },
    confirmed: { label: "Confirmada", cls: "bg-success/15 text-success" },
    seated: { label: "Em andamento", cls: "bg-accent/20 text-accent" },
    completed: { label: "Concluída", cls: "bg-muted text-muted-foreground" },
    cancelled: { label: "Cancelada", cls: "bg-destructive/10 text-destructive" },
    no_show: { label: "Não compareceu", cls: "bg-destructive/10 text-destructive" },
  };
  const s = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}

function DepositPill({ status, amount }: { status: string | null; amount: number | null }) {
  if (!status || status === "none") return null;
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Depósito pendente", cls: "bg-muted text-muted-foreground" },
    paid: { label: `Depósito pago${amount != null ? ` · ${amount.toFixed(2)}` : ""}`, cls: "bg-success/15 text-success" },
    failed: { label: "Depósito falhou", cls: "bg-destructive/10 text-destructive" },
    refunded: { label: "Depósito reembolsado", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[status];
  if (!s) return null;
  return <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center">
      <div className="size-14 rounded-2xl bg-foreground text-background grid place-items-center mx-auto mb-6">
        <CalendarPlus className="size-6" />
      </div>
      <h3 className="font-serif text-2xl italic mb-2">Nenhuma reserva ainda</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        Descubra restaurantes SeatFlow e reserve sua próxima mesa em segundos.
      </p>
      <Link to="/restaurants" className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90">
        Explorar restaurantes
      </Link>
    </div>
  );
}
