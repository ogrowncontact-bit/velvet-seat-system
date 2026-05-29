import { createFileRoute } from "@tanstack/react-router";
import { plans } from "@/lib/demo-data";
import { Check } from "lucide-react";

export const Route = createFileRoute("/app/billing")({
  component: Billing,
});

const invoices = [
  { id: "INV-2024-10", date: "Oct 1, 2024", amount: "$249.00", status: "Paid" },
  { id: "INV-2024-09", date: "Sep 1, 2024", amount: "$249.00", status: "Paid" },
  { id: "INV-2024-08", date: "Aug 1, 2024", amount: "$249.00", status: "Paid" },
  { id: "INV-2024-07", date: "Jul 1, 2024", amount: "$249.00", status: "Paid" },
];

function Billing() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <header>
        <h1 className="font-serif text-4xl md:text-5xl italic">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Subscription, fees, and invoices</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Current plan</p>
          <div className="mt-2 font-serif text-3xl italic">Pro</div>
          <p className="text-xs text-muted-foreground mt-1">$249/mo · renews Nov 1</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Booking fees · October</p>
          <div className="mt-2 font-serif text-3xl italic">$108.50</div>
          <p className="text-xs text-muted-foreground mt-1">310 confirmed bookings · $0.35 each</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Restaurant earnings</p>
          <div className="mt-2 font-serif text-3xl italic">$48,920</div>
          <p className="text-xs text-muted-foreground mt-1">+18% vs. last month</p>
        </div>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-medium mb-5">Change plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-5 border ${p.featured ? "border-foreground bg-foreground text-background" : "border-border"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{p.name}</span>
                {p.featured && <span className="text-[10px] uppercase tracking-wider bg-accent px-2 py-0.5 rounded">Current</span>}
              </div>
              <div className="font-serif text-3xl italic mb-2">
                {p.price}
                {p.price !== "Custom" && <span className="text-xs not-italic opacity-60 font-sans"> /mo</span>}
              </div>
              <ul className={`space-y-1.5 text-xs ${p.featured ? "text-background/80" : "text-muted-foreground"}`}>
                {p.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="size-3 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-medium">Invoices</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3">Invoice</th>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Amount</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-right px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((i) => (
              <tr key={i.id}>
                <td className="px-5 py-3 font-mono text-xs">{i.id}</td>
                <td className="px-5 py-3 text-muted-foreground">{i.date}</td>
                <td className="px-5 py-3">{i.amount}</td>
                <td className="px-5 py-3">
                  <span className="rounded bg-success/10 text-success px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {i.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-xs font-medium text-accent hover:underline">Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
