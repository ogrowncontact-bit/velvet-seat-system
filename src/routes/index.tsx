import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  LayoutGrid,
  MessageCircle,
  Shield,
  Users,
  Sparkles,
  LineChart,
  Star,
} from "lucide-react";
import { plans, stats, vipGuests, activity } from "@/lib/demo-data";
import { TableTile } from "@/components/table-tile";
import { floorTables } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SeatFlow — Reservations, reimagined for modern restaurants" },
      {
        name: "description",
        content:
          "The premium reservation, floor plan, and guest CRM platform. Reduce no-shows, automate WhatsApp confirmations, and orchestrate every service.",
      },
      { property: "og:title", content: "SeatFlow — Reservations, reimagined" },
      {
        property: "og:description",
        content: "Premium reservation, floor plan and guest CRM platform for modern restaurants.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-canvas text-foreground font-sans">
      <Nav />
      <Hero />
      <TrustStrip />
      <DashboardPreview />
      <Features />
      <FloorPlanShowcase />
      <Automation />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 md:px-10 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link to="/" className="font-serif text-2xl font-medium tracking-tight">
          SeatFlow
        </Link>
        <div className="hidden md:flex gap-6 text-sm font-medium text-foreground/60">
          <a href="#features" className="hover:text-foreground transition-colors">Platform</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/app" className="hidden sm:inline text-sm font-medium hover:text-foreground/80">
          Sign in
        </Link>
        <Link
          to="/book"
          className="hidden sm:inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          Book a table
        </Link>
        <Link
          to="/app"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
        >
          Open dashboard <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="px-6 md:px-10 pt-16 md:pt-28 pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium mb-8">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Now in private beta for Michelin-listed restaurants
        </div>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-balance max-w-4xl">
          Reservations,{" "}
          <span className="italic text-foreground/70">reimagined</span> for the modern dining room.
        </h1>
        <p className="mt-8 max-w-2xl text-lg md:text-xl text-muted-foreground text-pretty">
          SeatFlow orchestrates every seat, every guest, every service. Premium floor planning, AI
          occupancy, and WhatsApp automation — all in one calm, focused workspace.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/app"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-foreground px-6 text-sm font-medium text-background shadow-elevated hover:opacity-90 transition-opacity"
          >
            Explore the dashboard <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/book"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-medium hover:bg-muted"
          >
            See the guest experience
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          14-day free trial · No credit card required · Onboard in under 30 minutes
        </p>
      </div>
    </section>
  );
}

function TrustStrip() {
  const venues = ["LUMIÈRE", "Aoki & Sons", "Terrace Group", "The Gilded Fork", "Aura Lounge", "Vantage"];
  return (
    <section className="px-6 md:px-10 py-10 border-y border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Trusted by 1,200+ restaurants in 38 cities
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-60">
          {venues.map((v) => (
            <span key={v} className="font-serif text-xl italic">{v}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="px-4 md:px-10 py-20 max-w-7xl mx-auto">
      <div className="relative rounded-3xl border border-border bg-card shadow-elevated overflow-hidden">
        {/* Mock window chrome */}
        <div className="flex items-center gap-2 px-4 h-10 border-b border-border bg-muted/40">
          <div className="size-2.5 rounded-full bg-foreground/10" />
          <div className="size-2.5 rounded-full bg-foreground/10" />
          <div className="size-2.5 rounded-full bg-foreground/10" />
          <div className="ml-4 text-[10px] font-mono text-muted-foreground">app.seatflow.com / overview</div>
        </div>

        <div className="p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl italic">Service overview</h2>
              <p className="mt-1 text-sm text-muted-foreground">Friday, October 24 · Dinner service</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Live · 14 tables active
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-semibold tracking-tight">{s.value}</span>
                  <span className={`text-xs font-medium ${s.positive ? "text-success" : "text-destructive"}`}>
                    {s.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-medium">Main dining room</h3>
                <Legend />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {floorTables.slice(0, 8).map((t) => (
                  <TableTile key={t.id} {...t} />
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="rounded-3xl border border-border bg-card p-6">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  Upcoming VIPs
                </h3>
                <div className="space-y-4">
                  {vipGuests.slice(0, 3).map((g) => (
                    <div key={g.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-medium">
                          {g.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{g.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{g.next ?? `${g.visits} visits`}</p>
                        </div>
                      </div>
                      <span className="rounded bg-muted px-2 py-1 text-[9px] font-bold uppercase tracking-wider">
                        {g.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 rounded-3xl border border-border bg-card p-6">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  Live activity
                </h3>
                <div className="relative space-y-5 before:absolute before:top-2 before:left-[11px] before:h-[calc(100%-1rem)] before:w-px before:bg-border">
                  {activity.slice(0, 4).map((a) => (
                    <div key={a.id} className="relative flex gap-4">
                      <div
                        className={`z-10 mt-1 size-6 rounded-full border-2 border-card ${
                          a.tone === "accent"
                            ? "bg-accent"
                            : a.tone === "primary"
                              ? "bg-foreground"
                              : a.tone === "success"
                                ? "bg-success"
                                : a.tone === "destructive"
                                  ? "bg-destructive"
                                  : "bg-muted"
                        }`}
                      />
                      <div>
                        <p className="text-sm leading-snug">{a.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Legend() {
  const items = [
    { label: "Available", className: "bg-muted border border-border" },
    { label: "Reserved", className: "bg-accent" },
    { label: "Occupied", className: "bg-foreground" },
    { label: "Cleaning", className: "bg-success" },
  ];
  return (
    <div className="hidden sm:flex gap-3">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className={`size-2 rounded-full ${i.className}`} />
          {i.label}
        </div>
      ))}
    </div>
  );
}

function Features() {
  const features = [
    {
      icon: LayoutGrid,
      title: "Visual floor orchestration",
      body: "Drag-and-drop tables, merge for parties, watch statuses update in real time. Every seat, accounted for.",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp & SMS automation",
      body: "Confirmations, reminders, waitlist alerts and review requests — all in your guest's preferred channel.",
    },
    {
      icon: Shield,
      title: "Deposit protection",
      body: "Native Stripe, Apple Pay and Google Pay. Custom cancellation rules eliminate no-shows by up to 78%.",
    },
    {
      icon: Users,
      title: "Guest intelligence CRM",
      body: "Visit history, preferred tables, allergies, lifetime spend. Recognise every guest before they arrive.",
    },
    {
      icon: Sparkles,
      title: "AI service assistant",
      body: "Occupancy forecasting, smart scheduling, sentiment analysis, busy-hour prediction. Your second brain.",
    },
    {
      icon: LineChart,
      title: "Operator-grade analytics",
      body: "Cohort retention, source attribution, no-show curves, profit per cover — the metrics that move venues.",
    },
  ];

  return (
    <section id="features" className="px-6 md:px-10 py-24 max-w-7xl mx-auto">
      <div className="max-w-2xl mb-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-4">
          The Platform
        </p>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight text-balance">
          Everything a modern dining room needs.{" "}
          <span className="italic text-foreground/60">Nothing it doesn't.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-3xl overflow-hidden border border-border">
        {features.map((f) => (
          <div key={f.title} className="bg-card p-8 hover:bg-muted/40 transition-colors">
            <div className="size-10 rounded-xl bg-foreground text-background grid place-items-center mb-6">
              <f.icon className="size-5" />
            </div>
            <h3 className="text-lg font-medium mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FloorPlanShowcase() {
  return (
    <section className="px-6 md:px-10 py-24 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-4">
            Floor Plan Studio
          </p>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-6 text-balance">
            Map your venue as it is —{" "}
            <span className="italic text-foreground/60">not as software assumes.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Round tables, banquettes, chef's counter, terrace, private rooms. Configure shape,
            capacity, and merge rules. SeatFlow respects how your maître d' actually seats a room.
          </p>
          <ul className="space-y-3">
            {[
              "Multi-room layouts with custom shapes",
              "Smart merge rules (T-02 + T-03 = party of 6)",
              "Per-table minimums, deposits & dwell times",
              "Live timeline & turn forecasting",
            ].map((i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Check className="size-4 mt-0.5 text-success shrink-0" />
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated">
          <div className="grid grid-cols-4 gap-4">
            {floorTables.map((t) => (
              <TableTile key={t.id} {...t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Automation() {
  return (
    <section className="px-6 md:px-10 py-24 max-w-7xl mx-auto">
      <div className="rounded-3xl bg-foreground text-background p-10 md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-background/50 mb-4">
            Guest Communication
          </p>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-6">
            The conversations that{" "}
            <span className="italic text-background/60">protect your revenue.</span>
          </h2>
          <p className="text-background/70 leading-relaxed mb-6">
            Every confirmation, reminder, late-arrival nudge and review request — sent on the
            channel guests actually read. WhatsApp first, SMS fallback, all white-labelled to your
            brand.
          </p>
          <Link
            to="/book"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-background text-foreground px-5 text-sm font-medium hover:opacity-90"
          >
            See it in action <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {[
            { from: "SeatFlow · Lumière", body: "Hello Elena, your table for 2 at 18:30 tonight is confirmed. Reply 1 to keep, 2 to cancel.", time: "Sent automatically · 24h before" },
            { from: "Elena Rossi", body: "1", time: "Confirmed · no-show risk: 0%", mine: true },
            { from: "SeatFlow · Lumière", body: "Thank you Elena. Pier-side window held for you. See you tonight 🌒", time: "Sent automatically" },
          ].map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl p-4 text-sm ${m.mine ? "ml-auto bg-accent text-accent-foreground rounded-br-sm" : "bg-background/10 text-background rounded-bl-sm"}`}
            >
              <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{m.from}</div>
              {m.body}
              <div className="text-[10px] mt-2 opacity-60">{m.time}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="px-6 md:px-10 py-24 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-4">
          Pricing
        </p>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight">
          Built to scale with you.
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          A simple monthly subscription plus a small per-booking fee. No setup fees, no contracts,
          cancel anytime.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-3xl p-8 flex flex-col ${
              p.featured
                ? "bg-foreground text-background ring-2 ring-foreground shadow-elevated"
                : "bg-card border border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{p.name}</span>
              {p.featured && (
                <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  Most chosen
                </span>
              )}
            </div>
            <div className="font-serif text-5xl italic mb-1">
              {p.price}
              {p.price !== "Custom" && (
                <span className="not-italic text-sm font-sans opacity-60"> /mo</span>
              )}
            </div>
            <p className={`text-sm mb-6 ${p.featured ? "text-background/60" : "text-muted-foreground"}`}>
              {p.blurb}
            </p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className={`size-4 mt-0.5 shrink-0 ${p.featured ? "text-background/80" : "text-success"}`} />
                  {f}
                </li>
              ))}
            </ul>
            <div className={`text-xs mb-4 ${p.featured ? "text-background/60" : "text-muted-foreground"}`}>
              + {p.fee}
            </div>
            <button
              className={`h-11 rounded-xl text-sm font-medium ${
                p.featured
                  ? "bg-background text-foreground hover:opacity-90"
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {p.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      quote:
        "We cut no-shows by 71% in our first quarter. The floor plan alone replaced three different tools.",
      name: "Camille Aubert",
      role: "GM, Lumière",
    },
    {
      quote:
        "It's the first reservation platform that feels designed for hospitality, not extraction. Our hostesses love it.",
      name: "Tomasz Wieczorek",
      role: "Founder, Aoki & Sons",
    },
    {
      quote: "The CRM is what makes return guests feel seen. That's worth ten OpenTables.",
      name: "Naledi Okafor",
      role: "Director of Ops, Terrace Group",
    },
  ];
  return (
    <section className="px-6 md:px-10 py-24 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quotes.map((q) => (
          <figure key={q.name} className="rounded-3xl border border-border bg-card p-8">
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-foreground text-foreground" />
              ))}
            </div>
            <blockquote className="font-serif italic text-xl leading-snug mb-6">
              "{q.quote}"
            </blockquote>
            <figcaption className="text-sm">
              <div className="font-medium">{q.name}</div>
              <div className="text-muted-foreground text-xs">{q.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "How long does onboarding take?",
      a: "Most restaurants are live within 30 minutes. Import existing reservations from any provider; our team migrates your floor plan for free on Pro and Premium.",
    },
    {
      q: "Can I keep my existing booking widget?",
      a: "SeatFlow ships a white-label widget, QR codes, an Instagram-ready link and a Google Reserve integration. Use one, use them all.",
    },
    {
      q: "How do deposits and refunds work?",
      a: "Native Stripe processing with custom cancellation policies. Refund in one click, partial refunds, or auto-charge no-shows after a grace window.",
    },
    {
      q: "Do you charge per cover or per booking?",
      a: "Per confirmed booking only — never per cover, never per cancelled or no-show. You always know exactly what you're paying for.",
    },
    {
      q: "Is there a multi-location plan?",
      a: "Premium includes the multi-venue HQ: shared CRM, cross-venue analytics, and unified billing.",
    },
  ];
  return (
    <section id="faq" className="px-6 md:px-10 py-24 max-w-3xl mx-auto">
      <h2 className="font-serif text-4xl md:text-5xl text-center mb-12">Frequently asked.</h2>
      <div className="divide-y divide-border border-y border-border">
        {items.map((i) => (
          <details key={i.q} className="group py-6">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <span className="font-medium">{i.q}</span>
              <span className="font-serif text-2xl italic text-muted-foreground group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{i.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-6 md:px-10 py-24 max-w-7xl mx-auto">
      <div className="rounded-3xl bg-foreground text-background p-12 md:p-20 text-center">
        <h2 className="font-serif text-5xl md:text-6xl leading-tight max-w-3xl mx-auto text-balance">
          Transform reservations into{" "}
          <span className="italic text-background/60">seamless experiences.</span>
        </h2>
        <p className="mt-6 text-background/70 max-w-xl mx-auto">
          Join the restaurants designing the next decade of hospitality. Two weeks free, no card required.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/app"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-background text-foreground px-6 text-sm font-medium hover:opacity-90"
          >
            Open the dashboard <ArrowRight className="size-4" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex h-12 items-center rounded-xl border border-background/20 px-6 text-sm font-medium hover:bg-background/10"
          >
            See pricing
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 md:px-10 py-12 border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          <div className="font-serif text-2xl">SeatFlow</div>
          <p className="text-xs text-muted-foreground mt-2">
            Designed for service. © {new Date().getFullYear()} SeatFlow Inc.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-12 text-sm">
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Product</div>
            <a href="#features" className="block hover:text-foreground/80">Platform</a>
            <a href="#pricing" className="block hover:text-foreground/80">Pricing</a>
            <Link to="/app" className="block hover:text-foreground/80">Dashboard</Link>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Company</div>
            <a href="#" className="block hover:text-foreground/80">About</a>
            <a href="#" className="block hover:text-foreground/80">Customers</a>
            <a href="#" className="block hover:text-foreground/80">Careers</a>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Legal</div>
            <a href="#" className="block hover:text-foreground/80">Privacy</a>
            <a href="#" className="block hover:text-foreground/80">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
