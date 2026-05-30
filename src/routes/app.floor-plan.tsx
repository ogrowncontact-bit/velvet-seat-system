import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentRestaurant } from "@/hooks/use-current-restaurant";
import { fetchTables, fetchRooms, qk } from "@/lib/queries";
import { TableTile } from "@/components/table-tile";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/floor-plan")({ component: FloorPlan });

function FloorPlan() {
  const qc = useQueryClient();
  const { restaurantId } = useCurrentRestaurant();
  const rooms = useQuery({ queryKey: qk.rooms(restaurantId ?? ""), queryFn: () => fetchRooms(restaurantId!), enabled: !!restaurantId });
  const tables = useQuery({ queryKey: qk.tables(restaurantId ?? ""), queryFn: () => fetchTables(restaurantId!), enabled: !!restaurantId });
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const currentRoom = activeRoom ?? rooms.data?.[0]?.id ?? null;
  const visibleTables = tables.data?.filter((t) => !currentRoom || t.room_id === currentRoom) ?? [];

  const addTable = useMutation({
    mutationFn: async () => {
      if (!restaurantId || !currentRoom) throw new Error("Pick a room first");
      const next = (tables.data?.length ?? 0) + 1;
      const { error } = await supabase.from("tables").insert({
        restaurant_id: restaurantId,
        room_id: currentRoom,
        label: `T-${String(next).padStart(2, "0")}`,
        seats: 2,
        shape: "square",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tables(restaurantId ?? "") });
      toast.success("Table added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addRoom = useMutation({
    mutationFn: async () => {
      if (!restaurantId) return;
      const name = prompt("Room name (e.g. Terrace, Chef's counter)");
      if (!name) return;
      const { error } = await supabase.from("rooms").insert({ restaurant_id: restaurantId, name, sort_order: (rooms.data?.length ?? 0) });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.rooms(restaurantId ?? "") }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Floor plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure rooms, tables and capacities.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => addRoom.mutate()} className="h-10 px-4 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted">+ Room</button>
          <button onClick={() => addTable.mutate()} disabled={addTable.isPending || !currentRoom} className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50">
            {addTable.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Table
          </button>
        </div>
      </header>

      {rooms.data && rooms.data.length > 0 && (
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {rooms.data.map((r) => (
            <button key={r.id} onClick={() => setActiveRoom(r.id)} className={`h-10 px-4 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${(currentRoom === r.id) ? "border-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 min-h-[500px] grid-dots">
        {visibleTables.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visibleTables.map((t) => (
              <TableTile key={t.id} label={t.label} status={t.status} seats={t.seats} shape={t.shape as any} onClick={() => editTable(t.id, qc, restaurantId!)} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="font-serif text-2xl italic">An empty room, waiting</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Add your first table to start orchestrating service.</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[
          { label: "Open", c: "bg-muted/60 border border-dashed border-border" },
          { label: "Reserved", c: "bg-accent/15 border border-accent/30" },
          { label: "Seated", c: "bg-foreground" },
          { label: "Reset", c: "bg-success/20" },
          { label: "VIP", c: "bg-foreground ring-1 ring-accent" },
          { label: "Late", c: "bg-destructive/20" },
        ].map((i) => (
          <div key={i.label} className="flex items-center gap-2">
            <span className={`size-3 rounded ${i.c}`} />
            {i.label}
          </div>
        ))}
      </div>
    </div>
  );
}

async function editTable(id: string, qc: ReturnType<typeof useQueryClient>, restaurantId: string) {
  const action = prompt("Type 'delete' to remove this table, or enter new capacity (number):");
  if (!action) return;
  if (action.toLowerCase() === "delete") {
    const { error } = await supabase.from("tables").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Table removed");
  } else {
    const seats = parseInt(action, 10);
    if (!Number.isFinite(seats)) return;
    const { error } = await supabase.from("tables").update({ seats }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
  }
  qc.invalidateQueries({ queryKey: qk.tables(restaurantId) });
}
