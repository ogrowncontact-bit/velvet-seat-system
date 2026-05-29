import { createFileRoute } from "@tanstack/react-router";
import { floorTables } from "@/lib/demo-data";
import { TableTile } from "@/components/table-tile";

export const Route = createFileRoute("/app/floor-plan")({
  component: FloorPlan,
});

function FloorPlan() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl italic">Floor plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Drag tables to rearrange · click to edit capacity, deposits, dwell time</p>
        </div>
        <div className="flex gap-2">
          <button className="h-10 px-4 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted">Add room</button>
          <button className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90">+ Add table</button>
        </div>
      </header>

      <div className="flex gap-2 border-b border-border">
        {["Main room", "Terrace", "Chef's counter", "Private dining"].map((r, i) => (
          <button
            key={r}
            className={`h-10 px-4 text-sm font-medium border-b-2 -mb-px ${
              i === 0 ? "border-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-8 min-h-[600px]">
        <div className="grid grid-cols-4 gap-6">
          {floorTables.map((t) => (
            <TableTile key={t.id} {...t} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Available", className: "bg-muted border border-border" },
          { label: "Reserved", className: "bg-accent" },
          { label: "Occupied", className: "bg-foreground" },
          { label: "Cleaning", className: "bg-success/30" },
          { label: "VIP", className: "bg-foreground ring-1 ring-warning/40" },
          { label: "Delayed", className: "bg-destructive/30" },
        ].map((i) => (
          <div key={i.label} className="flex items-center gap-2 text-xs">
            <span className={`size-3 rounded ${i.className}`} />
            {i.label}
          </div>
        ))}
      </div>
    </div>
  );
}
