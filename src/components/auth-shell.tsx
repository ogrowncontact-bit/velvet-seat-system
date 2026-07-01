import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  side,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  side: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-canvas">
      <div className="flex-1 flex flex-col px-6 md:px-12 py-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-serif text-2xl tracking-tight">SeatFlow</Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="size-4" /> Home
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-3">{eyebrow}</p>
            <h1 className="font-serif text-4xl md:text-5xl italic mb-2">{title}</h1>
            <p className="text-sm text-muted-foreground mb-8">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 grid-dots opacity-10" />
        <div className="relative z-10 m-auto max-w-md p-12">{side}</div>
      </div>
    </div>
  );
}

export function inputClass() {
  return "mt-2 w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/30";
}
