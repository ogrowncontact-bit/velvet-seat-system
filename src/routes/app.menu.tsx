import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, X, Pencil } from "lucide-react";
import { formatMoney } from "@/lib/pos";

export const Route = createFileRoute("/app/menu")({ component: MenuPage });

function MenuPage() {
  const qc = useQueryClient();
  const { restaurantId, role, restaurant } = useCurrentRestaurant();
  const canManage = role === "owner" || role === "manager";
  const currency = restaurant?.currency ?? "BRL";

  const categories = useQuery({
    queryKey: ["menu_categories", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const items = useQuery({
    queryKey: ["menu_items", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [newCategory, setNewCategory] = useState("");

  const addCategory = useMutation({
    mutationFn: async () => {
      const name = newCategory.trim();
      if (!name) throw new Error("Name required");
      const { error } = await (supabase as any)
        .from("menu_categories")
        .insert({ restaurant_id: restaurantId, name });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewCategory("");
      qc.invalidateQueries({ queryKey: ["menu_categories", restaurantId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("menu_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_categories", restaurantId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const toggleAvail = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await (supabase as any)
        .from("menu_items")
        .update({ available })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_items", restaurantId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_items", restaurantId] }),
    onError: (e: any) => toast.error(e.message),
  });

  if (!canManage) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Only owners and managers can edit the menu.
      </div>
    );
  }

  const byCategory = (categories.data ?? []).map((c: any) => ({
    cat: c,
    items: (items.data ?? []).filter((i: any) => i.category_id === c.id),
  }));
  const uncategorized = (items.data ?? []).filter((i: any) => !i.category_id);

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Menu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Categories and items used by the cashier.
          </p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-2"
        >
          <Plus className="size-4" /> New item
        </button>
      </header>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Categories
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {(categories.data ?? []).map((c: any) => (
            <div
              key={c.id}
              className="group inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm"
            >
              {c.name}
              <button
                onClick={() => removeCategory.mutate(c.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <div className="inline-flex items-center gap-1">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category…"
              className="h-9 px-3 rounded-full border border-border bg-background text-sm w-40"
              onKeyDown={(e) => {
                if (e.key === "Enter") addCategory.mutate();
              }}
            />
            <button
              onClick={() => addCategory.mutate()}
              className="h-9 px-3 rounded-full bg-foreground text-background text-xs font-medium"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {byCategory.map(({ cat, items }: { cat: any; items: any[] }) => (
          <Section
            key={cat.id}
            title={cat.name}
            items={items}
            currency={currency}
            onEdit={setEditing}
            onToggle={(id, available) => toggleAvail.mutate({ id, available })}
            onRemove={(id) => removeItem.mutate(id)}
          />
        ))}
        {uncategorized.length > 0 && (
          <Section
            title="Uncategorized"
            items={uncategorized}
            currency={currency}
            onEdit={setEditing}
            onToggle={(id, available) => toggleAvail.mutate({ id, available })}
            onRemove={(id) => removeItem.mutate(id)}
          />
        )}
        {byCategory.length === 0 && uncategorized.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center">
            <p className="font-serif text-2xl italic">No items yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create a category and add your first item.
            </p>
          </div>
        )}
      </div>

      {editing && (
        <ItemDrawer
          item={editing.id ? editing : null}
          categories={categories.data ?? []}
          restaurantId={restaurantId!}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["menu_items", restaurantId] });
          }}
        />
      )}
    </div>
  );
}

function Section({
  title,
  items,
  currency,
  onEdit,
  onToggle,
  onRemove,
}: {
  title: string;
  items: any[];
  currency: string;
  onEdit: (i: any) => void;
  onToggle: (id: string, available: boolean) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((i) => (
          <div key={i.id} className="rounded-2xl border border-border bg-card p-4 group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{i.name}</div>
                {i.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {i.description}
                  </div>
                )}
              </div>
              <div className="tnum text-sm font-semibold">{formatMoney(i.price, currency)}</div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={i.available}
                  onChange={(e) => onToggle(i.id, e.target.checked)}
                />
                Available
              </label>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => onEdit(i)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => onRemove(i.id)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemDrawer({
  item,
  categories,
  restaurantId,
  onClose,
  onSaved,
}: {
  item: any | null;
  categories: any[];
  restaurantId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState<number>(Number(item?.price ?? 0));
  const [description, setDescription] = useState<string>(item?.description ?? "");
  const [categoryId, setCategoryId] = useState<string>(item?.category_id ?? "");
  const [available, setAvailable] = useState<boolean>(item?.available ?? true);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload: any = {
      restaurant_id: restaurantId,
      name: name.trim(),
      price,
      description: description.trim() || null,
      category_id: categoryId || null,
      available,
    };
    const q = item
      ? (supabase as any).from("menu_items").update(payload).eq("id", item.id)
      : (supabase as any).from("menu_items").insert(payload);
    const { error } = await q;
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(item ? "Item updated" : "Item created");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-card h-full p-8 overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl italic">{item ? "Edit item" : "New item"}</h2>
          <button onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price">
              <input
                type="number"
                step="0.01"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="input tnum"
              />
            </Field>
            <Field label="Category">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input"
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
            />
          </Field>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            Available for sale
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
          </button>
        </form>
        <style>{`.input{width:100%;height:42px;padding:0 12px;border-radius:10px;border:1px solid var(--color-border);background:var(--color-background);font-size:14px}textarea.input{height:auto;padding:10px 12px}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
