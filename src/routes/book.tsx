import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, Users, Clock, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { friendlyReservationError } from "@/lib/reservation-errors";

const bookSearchSchema = z.object({
  restaurant: z.string().optional(),
});

export const Route = createFileRoute("/book")({
  head: () => ({ meta: [
    { title: "Reserve a table — SeatFlow" },
    { name: "description", content: "Reserve your table." },
  ]}),
  validateSearch: bookSearchSchema,
  component: Book,
});

function Book() {
  const { user } = useAuth();
  const { restaurant: restaurantParam } = useSearch({ from: "/book" });
  const [step, setStep] = useState(1);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("19:30");
  const [party, setParty] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // Whether this venue has configured any restaurant_hours at all. If not, we fall
  // back to the fixed time list below instead of asking the (empty) availability
  // RPC, which would otherwise report the venue as closed every day.
  const [hasConfiguredHours, setHasConfiguredHours] = useState<boolean | null>(null);
  const [slots, setSlots] = useState<{ slot: string; local_time: string; tables_free: number }[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    const tbl = supabase.from("restaurants_public") as any;
    if (restaurantParam) {
      // A specific venue was chosen upstream (e.g. from /r/$slug) — resolve it by
      // slug first, falling back to id, so the booking flow stays connected to the
      // restaurant the visitor was actually looking at instead of picking an
      // arbitrary one.
      tbl.select("id, name").ilike("slug", restaurantParam).maybeSingle().then(({ data }: any) => {
        if (data) {
          setRestaurants([data]);
          setRestaurantId(data.id);
          return;
        }
        tbl.select("id, name").eq("id", restaurantParam).maybeSingle().then(({ data }: any) => {
          if (data) {
            setRestaurants([data]);
            setRestaurantId(data.id);
          }
        });
      });
      return;
    }
    tbl.select("id, name").order("name").limit(20).then(({ data }: any) => {
      if (data && data.length > 0) {
        setRestaurants(data);
        setRestaurantId(data[0].id);
      }
    });
  }, [restaurantParam]);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    supabase.from("restaurant_hours").select("id").eq("restaurant_id", restaurantId).limit(1).then(({ data }) => {
      if (!cancelled) setHasConfiguredHours((data?.length ?? 0) > 0);
    });
    return () => { cancelled = true; };
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId || !hasConfiguredHours) { setSlots(null); return; }
    let cancelled = false;
    setSlotsLoading(true);
    supabase.rpc("available_slots", { _restaurant_id: restaurantId, _date: date, _party_size: party })
      .then(({ data, error }) => {
        if (cancelled) return;
        setSlotsLoading(false);
        if (error) { toast.error(friendlyReservationError(error.message)); setSlots([]); return; }
        const rows = (data ?? []) as { slot: string; local_time: string; tables_free: number }[];
        setSlots(rows);
        if (rows.length > 0 && !rows.some((s) => s.local_time === time && s.tables_free > 0)) {
          const firstFree = rows.find((s) => s.tables_free > 0);
          if (firstFree) setTime(firstFree.local_time);
        }
      });
    return () => { cancelled = true; };
  }, [restaurantId, date, party, hasConfiguredHours]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      const meta = (user.user_metadata ?? {}) as { full_name?: string; phone?: string };
      if (!name && meta.full_name) setName(meta.full_name);
      if (!phone && meta.phone) setPhone(meta.phone);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!restaurantId) return toast.error("No restaurant available");
    setBusy(true);
    const matchingSlot = slots?.find((s) => s.local_time === time);
    const reservedAt = matchingSlot ? new Date(matchingSlot.slot) : new Date(`${date}T${time}:00`);
    const { error } = await supabase.from("reservations").insert({
      restaurant_id: restaurantId,
      guest_name: name, guest_phone: phone || null, guest_email: email || null,
      party_size: party, reserved_at: reservedAt.toISOString(), notes: notes || null,
      status: "pending", source: "widget",
      user_id: user?.id ?? null,
    });
    setBusy(false);
    if (error) return toast.error(friendlyReservationError(error.message));
    setStep(3);
  };

  const showDynamicSlots = hasConfiguredHours === true;
  const isVenueClosedToday = showDynamicSlots && !slotsLoading && (slots?.length ?? 0) === 0;
  const noCapacityLeft = showDynamicSlots && !slotsLoading && (slots?.length ?? 0) > 0 && !slots!.some((s) => s.tables_free > 0);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="min-h-screen bg-canvas">
      <header className="h-16 border-b border-border glass flex items-center px-6 md:px-10 justify-between">
        <Link to="/" className="font-serif text-2xl">SeatFlow</Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-3">
            {restaurants.find((r) => r.id === restaurantId)?.name ?? "SeatFlow"}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl italic">Reserve your table</h1>
        </div>

        <ol className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex items-center gap-3">
              <div className={`size-7 rounded-full grid place-items-center text-xs font-bold ${step >= n ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                {step > n ? <Check className="size-3.5" /> : n}
              </div>
              {n < 3 && <div className={`w-12 h-px ${step > n ? "bg-foreground" : "bg-border"}`} />}
            </li>
          ))}
        </ol>

        <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl italic">When are you joining us?</h2>
              {restaurants.length > 1 && (
                <div>
                  <Label icon={<Calendar className="size-4" />}>Venue</Label>
                  <select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm">
                    {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <Label icon={<Calendar className="size-4" />}>Date</Label>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {dates.map((d) => (
                    <button key={d} onClick={() => setDate(d)} className={`py-3 rounded-lg text-xs font-medium border tnum ${date === d ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
                      {new Date(d).toLocaleDateString([], { weekday: "short", day: "numeric" })}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label icon={<Users className="size-4" />}>Party size</Label>
                <div className="flex gap-2 flex-wrap">
                  {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <button key={n} onClick={() => setParty(n)} className={`size-10 rounded-lg text-sm font-medium border tnum ${party === n ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label icon={<Clock className="size-4" />}>Available times</Label>
                {showDynamicSlots && slotsLoading && (
                  <div className="py-3 text-sm text-muted-foreground inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Verificando horários…</div>
                )}
                {isVenueClosedToday && (
                  <p className="py-3 text-sm text-muted-foreground">O restaurante não abre neste dia. Escolha outra data.</p>
                )}
                {!isVenueClosedToday && noCapacityLeft && (
                  <p className="py-3 text-sm text-muted-foreground">Sem mesas livres para {party} pessoas neste dia. Tente outra data ou reduza o número de pessoas.</p>
                )}
                {(!showDynamicSlots || (!slotsLoading && !isVenueClosedToday)) && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(showDynamicSlots
                      ? (slots ?? []).map((s) => ({ t: s.local_time, full: s.tables_free <= 0 }))
                      : ["18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00"].map((t) => ({ t, full: false }))
                    ).map(({ t, full }) => (
                      <button
                        key={t}
                        onClick={() => !full && setTime(t)}
                        disabled={full}
                        title={full ? "Sem mesas livres neste horário" : undefined}
                        className={`py-3 rounded-lg text-xs font-medium border tnum ${
                          full ? "opacity-30 cursor-not-allowed border-border"
                          : time === t ? "bg-foreground text-background border-foreground"
                          : "border-border hover:bg-muted"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-serif text-2xl italic">A few details</h2>
              {[
                { label: "Full name", v: name, set: setName, required: true, type: "text" },
                { label: "Phone", v: phone, set: setPhone, type: "tel" },
                { label: "Email", v: email, set: setEmail, type: "email" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">{f.label}</label>
                  <input type={f.type} required={f.required} value={f.v} onChange={(e) => f.set(e.target.value)} className="w-full h-11 px-3.5 rounded-lg border border-border bg-background text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Special occasion or notes</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anniversary, allergies, accessibility…" className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto size-14 rounded-full bg-success/15 text-success grid place-items-center">
                <Check className="size-7" />
              </div>
              <div>
                <h2 className="font-serif text-3xl italic">Reservation requested.</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We'll confirm <span className="text-foreground font-medium">{new Date(date).toLocaleDateString([], {weekday:'long', day:'numeric', month:'long'})}</span> at <span className="text-foreground font-medium tnum">{time}</span> for <span className="text-foreground font-medium tnum">{party}</span>.
                </p>
              </div>
              <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-xl bg-foreground text-background px-5 text-sm font-medium hover:opacity-90">
                Back to SeatFlow
              </Link>
            </div>
          )}

          {step < 3 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 inline-flex items-center gap-1">
                <ArrowLeft className="size-4" /> Back
              </button>
              <div className="text-xs text-muted-foreground tnum">{new Date(date).toLocaleDateString([], {month:'short', day:'numeric'})} · {time} · {party}</div>
              <button
                onClick={() => step === 2 ? submit() : setStep(2)}
                disabled={busy || (step === 2 && !name.trim()) || (step === 1 && (isVenueClosedToday || noCapacityLeft || (showDynamicSlots && slotsLoading)))}
                className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <>{step === 2 ? "Confirm" : "Continue"} <ArrowRight className="size-4" /></>}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Label({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{icon} {children}</div>;
}
