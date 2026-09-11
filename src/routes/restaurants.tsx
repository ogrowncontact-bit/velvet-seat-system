import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Utensils, Star } from "lucide-react";

export const Route = createFileRoute("/restaurants")({
  head: () => ({
    meta: [
      { title: "Restaurantes — SeatFlow" },
      { name: "description", content: "Descubra restaurantes parceiros e reserve sua mesa." },
      { property: "og:title", content: "Restaurantes — SeatFlow" },
      { property: "og:description", content: "Descubra restaurantes parceiros e reserve sua mesa." },
    ],
  }),
  component: RestaurantsList,
});

function RestaurantsList() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-restaurants"],
    queryFn: async () => {
      // "*" rather than an explicit column list: avg_rating/review_count only exist
      // once the reviews migration has run, and a missing named column would 400 the
      // whole query (breaking the entire public directory) if code ships before that
      // migration is applied.
      const { data, error } = await (supabase.from("restaurants_public") as any)
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  return (
    <div className="min-h-screen bg-canvas">
      <header className="h-16 border-b border-border glass flex items-center px-6 md:px-10 justify-between">
        <Link to="/" className="font-serif text-2xl">SeatFlow</Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="size-4" /> Início
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-3">Vitrine</p>
          <h1 className="font-serif text-4xl md:text-5xl italic">Restaurantes</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Explore nossos parceiros, veja fotos e reserve em poucos cliques.
          </p>
        </div>

        {isLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            Nenhum restaurante publicado ainda.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.map((r) => {
            const photos = Array.isArray((r as any).photos) ? ((r as any).photos as string[]) : [];
            const cover = r.cover_image_url || photos[0] || null;
            return (
              <Link
                key={r.id}
                to="/r/$slug"
                params={{ slug: r.slug || r.id }}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {cover ? (
                    <img src={cover} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground">
                      <Utensils className="size-10" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl">{r.name}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    {Number((r as any).review_count) > 0 && (
                      <span className="inline-flex items-center gap-1 text-foreground font-medium">
                        <Star className="size-3 fill-accent text-accent" /> {Number((r as any).avg_rating).toFixed(1)}
                      </span>
                    )}
                    {r.cuisine && <span>{r.cuisine}</span>}
                    {r.price_range && <span className="tnum">{r.price_range}</span>}
                    {r.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" /> {r.city}
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
