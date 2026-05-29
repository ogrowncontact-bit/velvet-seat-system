import type { TableStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const styles: Record<TableStatus, string> = {
  available: "bg-muted text-muted-foreground border-2 border-dashed border-border",
  reserved: "bg-accent text-accent-foreground shadow-lg ring-4 ring-accent/10",
  occupied: "bg-foreground text-background",
  cleaning: "bg-success/10 text-success border border-success/30",
  vip: "bg-foreground text-background ring-1 ring-warning/40",
  delayed: "bg-destructive/10 text-destructive border border-destructive/30",
};

const labels: Record<TableStatus, string> = {
  available: "AVAILABLE",
  reserved: "RESERVED",
  occupied: "OCCUPIED",
  cleaning: "CLEANING",
  vip: "VIP",
  delayed: "DELAYED",
};

export function TableTile({
  label,
  status,
  seats,
  guest,
  span = 1,
  shape = "square",
}: {
  label: string;
  status: TableStatus;
  seats: number;
  guest?: string;
  span?: number;
  shape?: "round" | "square" | "rect";
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] cursor-pointer",
        span === 2 ? "col-span-2 aspect-[2/1]" : "aspect-square",
        shape === "round" ? "rounded-full" : span === 2 ? "rounded-3xl" : "rounded-2xl",
        styles[status],
      )}
    >
      {status === "vip" && (
        <div className="absolute top-2 left-3 rounded bg-warning/20 px-2 py-0.5 text-[8px] font-bold tracking-widest text-warning uppercase">
          VIP
        </div>
      )}
      <span className="text-xs font-bold">{label}</span>
      <span className="mt-1 text-[10px] opacity-80">{guest ?? `${seats} SEATS`}</span>
      <span className="mt-0.5 text-[9px] opacity-60 tracking-widest">{labels[status]}</span>
    </div>
  );
}
