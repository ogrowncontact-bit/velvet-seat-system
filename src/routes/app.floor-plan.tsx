import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useCurrentRestaurant, useIsPlatformAdmin } from "@/hooks/use-current-restaurant";
import { fetchTables, fetchRooms, qk } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, Trash2, Users, Square, Circle, RectangleHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/floor-plan")({ component: FloorPlan });

type TableShape = "round" | "square" | "rect";
type TableStatus = "available" | "reserved" | "occupied" | "cleaning" | "vip" | "delayed";

type TableRow = {
  id: string;
  restaurant_id: string;
  room_id: string;
  label: string;
  seats: number;
  shape: TableShape;
  status: TableStatus;
  pos_x: number;
  pos_y: number;
};

const CANVAS_W = 1200;
const CANVAS_H = 700;

const statusStyles: Record<TableStatus, string> = {
  available: "bg-muted/60 text-muted-foreground border border-dashed border-border",
  reserved: "bg-accent/15 text-foreground border border-accent/30",
  occupied: "bg-foreground text-background",
  cleaning: "bg-success/10 text-success border border-success/25",
  vip: "bg-foreground text-background ring-1 ring-accent/60",
  delayed: "bg-destructive/10 text-destructive border border-destructive/25",
};

function tableSize(seats: number, shape: TableShape) {
  // base scales with seats; rect is wider
  const s = Math.max(64, Math.min(160, 56 + seats * 10));
  if (shape === "rect") return { w: s * 1.5, h: s * 0.75 };
  return { w: s, h: s };
}

function FloorPlan() {
  const qc = useQueryClient();
  const { restaurantId, role } = useCurrentRestaurant();
  const { data: isPlatformAdmin } = useIsPlatformAdmin();
  const canManage = isPlatformAdmin || role === "owner" || role === "manager";
  const rooms = useQuery({
    queryKey: qk.rooms(restaurantId ?? ""),
    queryFn: () => fetchRooms(restaurantId!),
    enabled: !!restaurantId,
  });
  const tables = useQuery({
    queryKey: qk.tables(restaurantId ?? ""),
    queryFn: () => fetchTables(restaurantId!) as Promise<TableRow[]>,
    enabled: !!restaurantId,
  });

  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [editing, setEditing] = useState<TableRow | null>(null);
  const [editingRoom, setEditingRoom] = useState<{ id: string; name: string } | null>(null);

  const currentRoom = activeRoom ?? rooms.data?.[0]?.id ?? null;
  const visibleTables: TableRow[] =
    tables.data?.filter((t) => !currentRoom || t.room_id === currentRoom) ?? [];

  // Local optimistic positions while dragging
  const [localPos, setLocalPos] = useState<Record<string, { x: number; y: number }>>({});

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const updatePos = useMutation({
    mutationFn: async ({ id, x, y }: { id: string; x: number; y: number }) => {
      const { error } = await supabase.from("tables").update({ pos_x: x, pos_y: y }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tables(restaurantId ?? "") }),
    onError: (e: any) => toast.error(e.message),
  });

  const onPointerDown = (e: React.PointerEvent, t: TableRow) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const { w, h } = tableSize(t.seats, t.shape);
    const x = (t.pos_x / CANVAS_W) * rect.width;
    const y = (t.pos_y / CANVAS_H) * rect.height;
    dragRef.current = {
      id: t.id,
      offsetX: e.clientX - rect.left - x - w / 2,
      offsetY: e.clientY - rect.top - y - h / 2,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const t = visibleTables.find((x) => x.id === dragRef.current!.id);
    if (!t) return;
    const { w, h } = tableSize(t.seats, t.shape);
    const px = e.clientX - rect.left - dragRef.current.offsetX - w / 2;
    const py = e.clientY - rect.top - dragRef.current.offsetY - h / 2;
    const clampedX = Math.max(0, Math.min(rect.width - w, px));
    const clampedY = Math.max(0, Math.min(rect.height - h, py));
    const normX = Math.round((clampedX / rect.width) * CANVAS_W);
    const normY = Math.round((clampedY / rect.height) * CANVAS_H);
    setLocalPos((p) => ({ ...p, [t.id]: { x: normX, y: normY } }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const id = dragRef.current.id;
    const pos = localPos[id];
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (pos) updatePos.mutate({ id, ...pos });
  };

  // Track if click vs drag (avoid opening edit when dragging)
  const downTime = useRef(0);
  const downPos = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Floor plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arraste mesas, edite formato e capacidade. Mudanças salvam automaticamente.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRoomOpen(true)}
            className="h-10 px-4 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted"
          >
            + Sala
          </button>
          <button
            onClick={() => {
              if (!currentRoom) return toast.error("Crie uma sala primeiro");
              setAddOpen(true);
            }}
            className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center gap-2"
          >
            <Plus className="size-4" /> Mesa
          </button>
        </div>
      </header>

      {rooms.data && rooms.data.length > 0 && (
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {rooms.data.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRoom(r.id)}
              onDoubleClick={() => setEditingRoom({ id: r.id, name: r.name })}
              title="Duplo clique para renomear/excluir"
              className={`h-10 px-4 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
                currentRoom === r.id
                  ? "border-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      <div
        ref={canvasRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative rounded-3xl border border-border bg-card grid-dots overflow-hidden select-none touch-none"
        style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
      >
        {visibleTables.length === 0 && (
          <div className="absolute inset-0 grid place-items-center text-center px-6">
            <div>
              <p className="font-serif text-2xl italic">Sala vazia</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Adicione mesas e arraste para posicionar.
              </p>
            </div>
          </div>
        )}

        {visibleTables.map((t) => {
          const pos = localPos[t.id] ?? { x: t.pos_x, y: t.pos_y };
          const { w, h } = tableSize(t.seats, t.shape);
          const leftPct = (pos.x / CANVAS_W) * 100;
          const topPct = (pos.y / CANVAS_H) * 100;
          return (
            <button
              key={t.id}
              onPointerDown={(e) => {
                downTime.current = Date.now();
                downPos.current = { x: e.clientX, y: e.clientY };
                onPointerDown(e, t);
              }}
              onClick={(e) => {
                const dt = Date.now() - downTime.current;
                const dx = downPos.current ? Math.abs(e.clientX - downPos.current.x) : 0;
                const dy = downPos.current ? Math.abs(e.clientY - downPos.current.y) : 0;
                if (dt < 250 && dx < 4 && dy < 4) setEditing(t);
              }}
              className={cn(
                "absolute flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing transition-shadow hover:shadow-soft",
                statusStyles[t.status],
                t.shape === "round" ? "rounded-full" : "rounded-2xl",
              )}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: w,
                height: h,
              }}
            >
              <span className="text-sm font-semibold tnum">{t.label}</span>
              <span className="mt-0.5 text-[10px] opacity-70 inline-flex items-center gap-1">
                <Users className="size-3" /> {t.seats}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[
          { label: "Livre", c: "bg-muted/60 border border-dashed border-border" },
          { label: "Reservada", c: "bg-accent/15 border border-accent/30" },
          { label: "Ocupada", c: "bg-foreground" },
          { label: "Limpeza", c: "bg-success/20" },
          { label: "VIP", c: "bg-foreground ring-1 ring-accent" },
          { label: "Atrasada", c: "bg-destructive/20" },
        ].map((i) => (
          <div key={i.label} className="flex items-center gap-2">
            <span className={`size-3 rounded ${i.c}`} />
            {i.label}
          </div>
        ))}
      </div>

      {addOpen && (
        <AddTableDialog
          restaurantId={restaurantId!}
          roomId={currentRoom!}
          existingCount={tables.data?.length ?? 0}
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            qc.invalidateQueries({ queryKey: qk.tables(restaurantId ?? "") });
          }}
        />
      )}

      {editing && (
        <EditTableDialog
          table={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: qk.tables(restaurantId ?? "") });
          }}
        />
      )}

      {roomOpen && (
        <RoomDialog
          restaurantId={restaurantId!}
          existingCount={rooms.data?.length ?? 0}
          onClose={() => setRoomOpen(false)}
          onSaved={(id) => {
            setRoomOpen(false);
            qc.invalidateQueries({ queryKey: qk.rooms(restaurantId ?? "") });
            if (id) setActiveRoom(id);
          }}
        />
      )}

      {editingRoom && (
        <RoomDialog
          restaurantId={restaurantId!}
          existingCount={rooms.data?.length ?? 0}
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onSaved={() => {
            setEditingRoom(null);
            qc.invalidateQueries({ queryKey: qk.rooms(restaurantId ?? "") });
            qc.invalidateQueries({ queryKey: qk.tables(restaurantId ?? "") });
          }}
        />
      )}
    </div>
  );
}

function RoomDialog({
  restaurantId,
  existingCount,
  room,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  existingCount: number;
  room?: { id: string; name: string };
  onClose: () => void;
  onSaved: (id?: string) => void;
}) {
  const [name, setName] = useState(room?.name ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    if (room) {
      const { error } = await supabase.from("rooms").update({ name: name.trim() }).eq("id", room.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Sala atualizada");
      onSaved(room.id);
    } else {
      const { data, error } = await supabase
        .from("rooms")
        .insert({ restaurant_id: restaurantId, name: name.trim(), sort_order: existingCount })
        .select("id")
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Sala criada");
      onSaved(data?.id);
    }
  };

  const remove = async () => {
    if (!room) return;
    if (!confirm(`Excluir sala "${room.name}"? Todas as mesas dentro dela também serão removidas.`))
      return;
    await supabase.from("tables").delete().eq("room_id", room.id);
    const { error } = await supabase.from("rooms").delete().eq("id", room.id);
    if (error) return toast.error(error.message);
    toast.success("Sala removida");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room ? "Editar sala" : "Nova sala"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              autoFocus
              value={name}
              placeholder="Ex: Terraço, Salão Principal, Chef's Counter"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>
        </div>
        <DialogFooter className={room ? "flex sm:justify-between gap-2" : ""}>
          {room && (
            <Button variant="destructive" onClick={remove}>
              <Trash2 className="size-4 mr-2" /> Excluir
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving || !name.trim()}>
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              {room ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShapePicker({
  value,
  onChange,
}: {
  value: TableShape;
  onChange: (v: TableShape) => void;
}) {
  const items: { v: TableShape; icon: React.ReactNode; label: string }[] = [
    { v: "square", icon: <Square className="size-5" />, label: "Quadrada" },
    { v: "round", icon: <Circle className="size-5" />, label: "Redonda" },
    { v: "rect", icon: <RectangleHorizontal className="size-5" />, label: "Retangular" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((i) => (
        <button
          key={i.v}
          type="button"
          onClick={() => onChange(i.v)}
          className={cn(
            "h-20 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition-colors",
            value === i.v
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:bg-muted",
          )}
        >
          {i.icon}
          {i.label}
        </button>
      ))}
    </div>
  );
}

function AddTableDialog({
  restaurantId,
  roomId,
  existingCount,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  roomId: string;
  existingCount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(`T-${String(existingCount + 1).padStart(2, "0")}`);
  const [seats, setSeats] = useState(2);
  const [shape, setShape] = useState<TableShape>("square");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("tables").insert({
      restaurant_id: restaurantId,
      room_id: roomId,
      label,
      seats,
      shape,
      pos_x: 60 + ((existingCount * 40) % (CANVAS_W - 200)),
      pos_y: 60 + ((existingCount * 30) % (CANVAS_H - 200)),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Mesa adicionada");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova mesa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Identificação</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Formato</Label>
            <ShapePicker value={shape} onChange={setShape} />
          </div>
          <div className="space-y-2">
            <Label>Capacidade: {seats} pessoas</Label>
            <Input
              type="range"
              min={1}
              max={20}
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving || !label}>
            {saving && <Loader2 className="size-4 animate-spin mr-2" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTableDialog({
  table,
  onClose,
  onSaved,
}: {
  table: TableRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(table.label);
  const [seats, setSeats] = useState(table.seats);
  const [shape, setShape] = useState<TableShape>(table.shape);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLabel(table.label);
    setSeats(table.seats);
    setShape(table.shape);
  }, [table]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("tables")
      .update({ label, seats, shape })
      .eq("id", table.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Mesa atualizada");
    onSaved();
  };

  const remove = async () => {
    if (!confirm(`Remover mesa ${table.label}?`)) return;
    const { error } = await supabase.from("tables").delete().eq("id", table.id);
    if (error) return toast.error(error.message);
    toast.success("Mesa removida");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar mesa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Identificação</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Formato</Label>
            <ShapePicker value={shape} onChange={setShape} />
          </div>
          <div className="space-y-2">
            <Label>Capacidade: {seats} pessoas</Label>
            <Input
              type="range"
              min={1}
              max={20}
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter className="flex sm:justify-between gap-2">
          <Button variant="destructive" onClick={remove}>
            <Trash2 className="size-4 mr-2" /> Remover
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving || !label}>
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
