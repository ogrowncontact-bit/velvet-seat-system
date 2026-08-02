import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { qk } from "@/lib/queries";
import { setSelectedRestaurant } from "@/hooks/use-current-restaurant";

const TZS = ["UTC", "America/Sao_Paulo", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Madrid", "Europe/Paris", "Asia/Tokyo", "Asia/Dubai"];
const CURRENCIES = ["BRL", "USD", "EUR", "GBP", "JPY", "AED"];
const CUISINES = ["Contemporânea", "Italiana", "Japonesa", "Brasileira", "Francesa", "Steakhouse", "Bistrô", "Frutos do mar", "Vegetariana", "Outra"];
const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

const inputCls =
  "mt-2 w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/30";
const labelCls = "text-xs font-medium uppercase tracking-widest text-muted-foreground";

const STEPS = ["Restaurante", "Contato", "Sala & mesas", "Ativação"] as const;

export function OnboardingScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0 — venue
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState(CUISINES[0]!);
  const [priceRange, setPriceRange] = useState(PRICE_RANGES[1]!);
  const [timezone, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "America/Sao_Paulo");
  const [currency, setCurrency] = useState("BRL");

  // Step 1 — admin + contact
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  // Step 2 — room + tables
  const [roomName, setRoomName] = useState("Salão principal");
  const [tableCount, setTableCount] = useState(8);
  const [seats, setSeats] = useState(4);

  // Step 3
  const [publish, setPublish] = useState(false);

  const canNext =
    (step === 0 && name.trim().length > 1) ||
    (step === 1 && fullName.trim().length > 1) ||
    step === 2 ||
    step === 3;

  const finish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: r, error: e1 } = await supabase
        .from("restaurants")
        .insert({
          name: name.trim(),
          timezone,
          currency,
          cuisine,
          price_range: priceRange,
          city: city.trim() || null,
          address: address.trim() || null,
          phone: phone.trim() || null,
          whatsapp_phone: phone.trim() || null,
          is_published: publish,
          created_by: user.id,
        })
        .select()
        .single();
      if (e1 || !r) throw e1 ?? new Error("Falha ao criar restaurante");

      const { error: e2 } = await supabase
        .from("restaurant_members")
        .insert({ restaurant_id: r.id, user_id: user.id, role: "owner" });
      if (e2) throw e2;

      await supabase.from("profiles").update({ full_name: fullName.trim(), current_restaurant_id: r.id }).eq("id", user.id);

      const { data: room } = await supabase
        .from("rooms")
        .insert({ restaurant_id: r.id, name: roomName.trim() || "Salão principal", sort_order: 0 })
        .select()
        .single();

      if (room && tableCount > 0) {
        const cols = Math.ceil(Math.sqrt(tableCount));
        const rows = Array.from({ length: tableCount }, (_, i) => ({
          restaurant_id: r.id,
          room_id: room.id,
          label: `M${i + 1}`,
          seats,
          shape: (seats <= 2 ? "round" : seats <= 4 ? "square" : "rect") as "round" | "square" | "rect",
          pos_x: 80 + (i % cols) * 140,
          pos_y: 80 + Math.floor(i / cols) * 140,
        }));
        await supabase.from("tables").insert(rows);
      }

      setSelectedRestaurant(r.id);
      await qc.invalidateQueries({ queryKey: qk.myRestaurants });
      toast.success(`${r.name} está ativo.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Não foi possível concluir o cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-canvas">
      <div className="flex flex-col p-8 md:p-14">
        <div className="font-serif text-2xl">SeatFlow</div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs mb-6">
              <Sparkles className="size-3 text-accent" />
              Passo {step + 1} de {STEPS.length} · {STEPS[step]}
            </div>

            <div className="flex gap-1.5 mb-8">
              {STEPS.map((s, i) => (
                <div key={s} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-foreground" : "bg-border"}`} />
              ))}
            </div>

            {step === 0 && (
              <>
                <h1 className="font-serif text-4xl md:text-5xl italic leading-tight mb-3">Vamos cadastrar seu restaurante.</h1>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  Tudo pode ser editado depois em Configurações.
                </p>
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Nome do restaurante</label>
                    <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Lumière, São Paulo" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Cozinha</label>
                      <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className={inputCls}>
                        {CUISINES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Faixa de preço</label>
                      <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className={inputCls}>
                        {PRICE_RANGES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Fuso horário</label>
                      <select value={timezone} onChange={(e) => setTz(e.target.value)} className={inputCls}>
                        {[...new Set([timezone, ...TZS])].map((tz) => <option key={tz}>{tz}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Moeda</label>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
                        {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="font-serif text-4xl md:text-5xl italic leading-tight mb-3">Quem administra a casa?</h1>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  Você será o <strong>administrador (owner)</strong> deste restaurante e poderá convidar sua equipe depois.
                </p>
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Seu nome completo</label>
                    <input autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Maria Souza" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>E-mail de acesso</label>
                    <input value={user?.email ?? ""} disabled className={`${inputCls} opacity-60`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Telefone / WhatsApp</label>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 11 90000-0000" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Cidade</label>
                      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Endereço</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua Augusta, 1200" className={inputCls} />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="font-serif text-4xl md:text-5xl italic leading-tight mb-3">Monte sua primeira sala.</h1>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  Criamos as mesas automaticamente — você reposiciona no mapa depois.
                </p>
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Nome da sala</label>
                    <input value={roomName} onChange={(e) => setRoomName(e.target.value)} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Quantidade de mesas</label>
                      <input type="number" min={0} max={60} value={tableCount} onChange={(e) => setTableCount(Math.max(0, Math.min(60, Number(e.target.value))))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Lugares por mesa</label>
                      <input type="number" min={1} max={20} value={seats} onChange={(e) => setSeats(Math.max(1, Math.min(20, Number(e.target.value))))} className={inputCls} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Capacidade inicial: <strong>{tableCount * seats}</strong> lugares.
                  </p>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="font-serif text-4xl md:text-5xl italic leading-tight mb-3">Ativar o restaurante.</h1>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">Confira antes de concluir.</p>
                <dl className="rounded-2xl border border-border bg-card divide-y divide-border text-sm mb-6">
                  {[
                    ["Restaurante", `${name} · ${cuisine} · ${priceRange}`],
                    ["Local", [address, city].filter(Boolean).join(", ") || "—"],
                    ["Administrador", `${fullName} · ${user?.email ?? ""}`],
                    ["Sala", `${roomName} · ${tableCount} mesas · ${tableCount * seats} lugares`],
                    ["Preferências", `${timezone} · ${currency}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-4 px-4 py-3">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 cursor-pointer">
                  <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="mt-0.5 size-4" />
                  <span className="text-sm">
                    Publicar na vitrine pública
                    <span className="block text-xs text-muted-foreground">Aparece em /restaurants e permite reservas online.</span>
                  </span>
                </label>
              </>
            )}

            <div className="flex items-center gap-3 mt-8">
              {step > 0 && (
                <button onClick={() => setStep((s) => s - 1)} disabled={loading} className="h-12 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2">
                  <ArrowLeft className="size-4" /> Voltar
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext}
                  className="flex-1 h-12 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continuar <ArrowRight className="size-4" />
                </button>
              ) : (
                <button
                  onClick={finish}
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <>Ativar restaurante <Check className="size-4" /></>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 grid-dots opacity-10" />
        <div className="m-auto max-w-md p-12 relative">
          <h2 className="font-serif text-4xl italic leading-tight mb-6">Um sistema operacional calmo para o salão.</h2>
          <p className="text-background/70 leading-relaxed">
            Reservas, mapa de mesas, clientes e caixa em um só lugar. Feito para desaparecer durante o serviço.
          </p>
        </div>
      </div>
    </div>
  );
}
