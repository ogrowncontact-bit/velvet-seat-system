import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Phone, Globe, Mail, MessageCircle, Calendar, Star, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/r/$slug")({
  component: RestaurantDetail,
});

function RestaurantDetail() {
  const { slug } = useParams({ from: "/r/$slug" });

  const { data, isLoading } = useQuery({
    queryKey: ["public-restaurant", slug],
    queryFn: async () => {
      const tbl = supabase.from("restaurants_public") as any;
      let q = await tbl.select("*").ilike("slug", slug).maybeSingle();
      if (!q.data) {
        q = await tbl.select("*").eq("id", slug).maybeSingle();
      }
      if (q.error) throw q.error;
      return q.data as any;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["public-restaurant-reviews", data?.id],
    enabled: !!data?.id,
    queryFn: async () => {
      const { data: rows, error } = await (supabase as any).from("reviews")
        .select("id, rating, comment, created_at")
        .eq("restaurant_id", data!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return rows ?? [];
    },
  });

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  }
  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl italic">Não encontrado</h1>
          <Link to="/restaurants" className="mt-4 inline-block text-sm underline">Voltar para a vitrine</Link>
        </div>
      </div>
    );
  }

  const photos: string[] = Array.isArray(data.photos) ? data.photos : [];
  const cover = data.cover_image_url || photos[0] || null;
  const waPhone = (data.whatsapp_phone || "").replace(/\D/g, "");
  const waLink = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Olá! Quero saber mais sobre o ${data.name}.`)}`
    : null;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="h-16 border-b border-border glass flex items-center px-6 md:px-10 justify-between">
        <Link to="/" className="font-serif text-2xl">SeatFlow</Link>
        <Link to="/restaurants" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="size-4" /> Vitrine
        </Link>
      </header>

      {cover && (
        <div className="h-72 md:h-96 w-full overflow-hidden bg-muted">
          <img src={cover} alt={data.name} className="w-full h-full object-cover" />
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-8">
          <div>
            {data.cuisine && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-2">{data.cuisine}</p>
            )}
            <h1 className="font-serif text-4xl md:text-5xl italic">{data.name}</h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              {Number(data.review_count) > 0 && (
                <span className="inline-flex items-center gap-1 text-foreground font-medium">
                  <Star className="size-4 fill-accent text-accent" /> {Number(data.avg_rating).toFixed(1)}
                  <span className="text-muted-foreground font-normal">({data.review_count})</span>
                </span>
              )}
              {data.price_range && <span className="tnum">{data.price_range}</span>}
              {data.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" /> {data.city}
                </span>
              )}
            </div>
          </div>

          {data.description && (
            <section>
              <h2 className="font-medium text-sm uppercase tracking-widest text-muted-foreground mb-3">Sobre</h2>
              <p className="text-base leading-relaxed whitespace-pre-line">{data.description}</p>
            </section>
          )}

          {photos.length > 0 && (
            <section>
              <h2 className="font-medium text-sm uppercase tracking-widest text-muted-foreground mb-3">Galeria</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((p, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-xl bg-muted">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {reviews && reviews.length > 0 && (
            <section>
              <h2 className="font-medium text-sm uppercase tracking-widest text-muted-foreground mb-3">
                Avaliações ({reviews.length})
              </h2>
              <div className="space-y-4">
                {reviews.map((rv: any) => (
                  <div key={rv.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="inline-flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={`size-3.5 ${n <= rv.rating ? "fill-accent text-accent" : "text-border"}`} />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <ShieldCheck className="size-3" /> Reserva verificada
                      </span>
                    </div>
                    {rv.comment && <p className="text-sm leading-relaxed">{rv.comment}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {format(new Date(rv.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.hours && (
            <section>
              <h2 className="font-medium text-sm uppercase tracking-widest text-muted-foreground mb-3">Horários</h2>
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {typeof data.hours === "string" ? data.hours : JSON.stringify(data.hours, null, 2)}
              </pre>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <Link
              to="/book"
              search={{ restaurant: data.slug || data.id }}
              className="w-full h-12 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90"
            >
              <Calendar className="size-4" /> Reservar mesa
            </Link>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 w-full h-12 rounded-xl border border-border text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-muted"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-3 text-sm">
            <h3 className="font-medium text-xs uppercase tracking-widest text-muted-foreground">Contato</h3>
            {data.address && (
              <div className="flex items-start gap-2"><MapPin className="size-4 mt-0.5 shrink-0" /><span>{data.address}</span></div>
            )}
            {data.phone && (
              <div className="flex items-center gap-2"><Phone className="size-4" /><a href={`tel:${data.phone}`} className="hover:underline">{data.phone}</a></div>
            )}
            {data.email && (
              <div className="flex items-center gap-2"><Mail className="size-4" /><a href={`mailto:${data.email}`} className="hover:underline">{data.email}</a></div>
            )}
            {data.website && (
              <div className="flex items-center gap-2"><Globe className="size-4" /><a href={data.website} target="_blank" rel="noreferrer" className="hover:underline truncate">{data.website}</a></div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
