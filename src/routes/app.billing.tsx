import { createFileRoute } from "@tanstack/react-router";
import { plans } from "@/lib/demo-data";
import { Check } from "lucide-react";

export const Route = createFileRoute("/app/billing")({ component: Billing });

function Billing() {
  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-fade-in">
      <header>
        <h1 className="font-serif text-4xl md:text-5xl italic">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Subscription, fees, and invoices.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Current plan</p>
          <div className="mt-3 font-serif text-3xl italic">Free trial</div>
          <p className="text-xs text-muted-foreground mt-2">No card on file</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Booking fees this month</p>
          <div className="mt-3 font-serif text-3xl italic tnum">$0.00</div>
          <p className="text-xs text-muted-foreground mt-2">Pay-as-you-grow</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Next invoice</p>
          <div className="mt-3 font-serif text-3xl italic">—</div>
          <p className="text-xs text-muted-foreground mt-2">After your first subscription</p>
        </div>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-medium mb-5">Choose a plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl p-5 border ${p.featured ? "border-foreground bg-foreground text-background" : "border-border"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{p.name}</span>
                {p.featured && <span className="text-[10px] uppercase tracking-wider bg-accent text-accent-foreground px-2 py-0.5 rounded">Recommended</span>}
              </div>
              <div className="font-serif text-3xl italic mb-2 tnum">
                {p.price}{p.price !== "Custom" && <span className="text-xs not-italic opacity-60 font-sans"> /mo</span>}
              </div>
              <ul className={`space-y-1.5 text-xs ${p.featured ? "text-background/80" : "text-muted-foreground"}`}>
                {p.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-1.5"><Check className="size-3 mt-0.5 shrink-0" /> {f}</li>
                ))}
              </ul>
              <button className={`mt-5 w-full h-10 rounded-lg text-sm font-medium ${p.featured ? "bg-background text-foreground" : "bg-foreground text-background"}`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-12 text-center">
        <p className="font-serif text-2xl italic">No invoices yet</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Once you upgrade to a paid plan, your invoices will appear here.</p>
      </section>
    </div>
  );
}
