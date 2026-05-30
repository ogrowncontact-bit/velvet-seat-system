import type { TableStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const styles: Record<TableStatus, string> = {
  available: "bg-muted/60 text-muted-foreground border border-dashed border-border",
  reserved: "bg-accent/15 text-foreground border border-accent/30",
  occupied: "bg-foreground text-background",
  cleaning: "bg-success/10 text-success border border-success/25",
  vip: "bg-foreground text-background ring-1 ring-accent/60",
  delayed: "bg-destructive/10 text-destructive border border-destructive/25",
};

const labels: Record<TableStatus, string> = {
  available: "OPEN",
  reserved: "RESERVED",
  occupied: "SEATED",
  cleaning: "RESET",
  vip: "VIP",
  delayed: "LATE",
};

export function TableTile({
  label,
  status,
  seats,
  guest,
  span = 1,
  shape = "square",
  onClick,
}: {
  label: string;
  status: TableStatus;
  seats: number;
  guest?: string;
  span?: number;
  shape?: "round" | "square" | "rect";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-soft",
        span === 2 ? "col-span-2 aspect-[2/1]" : "aspect-square",
        shape === "round" ? "rounded-full" : span === 2 ? "rounded-3xl" : "rounded-2xl",
        styles[status],
      )}
    >
      {status === "vip" && (
        <div className="absolute top-2 left-3 rounded bg-accent/30 px-2 py-0.5 text-[8px] font-bold tracking-widest text-accent uppercase">
          VIP
        </div>
      )}
      <span className="text-sm font-semibold tnum">{label}</span>
      <span className="mt-1 text-[10px] opacity-80 line-clamp-1 px-2">{guest ?? `${seats} seats`}</span>
      <span className="mt-0.5 text-[9px] opacity-60 tracking-[0.15em]">{labels[status]}</span>
    </button>
  );
}
