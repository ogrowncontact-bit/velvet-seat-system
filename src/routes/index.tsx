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
import { plans } from "@/lib/demo-data";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SeatFlow — A premium operating system for modern restaurants" },
      {
        name: "description",
        content:
          "Reduce no-shows, orchestrate every service, and recognise every guest. A calm, premium reservation, floor plan and CRM platform.",
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
      <Features />
      <Showcase />
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
    <nav className="sticky top-0 z-50 h-16 glass border-b border-border">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-serif text-2xl tracking-tight">SeatFlow</Link>
          <div className="hidden md:flex gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Platform</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/cliente/login" className="hidden md:inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted">
            Sou cliente
          </Link>
          <Link to="/staff/login" className="hidden sm:inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted">
            Sou restaurante
          </Link>
          <Link
            to="/restaurants"
            className="hidden sm:inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
          >
            Reservar mesa
          </Link>
          <Link
            to="/staff/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
          >
            Get started <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative px-6 md:px-10 pt-20 md:pt-32 pb-16 max-w-7xl mx-auto">
      <div className="absolute inset-0 grid-dots opacity-40 pointer-events-none -z-0" />
      <div className="relative flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur px-3 py-1 text-xs font-medium mb-10">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          A calm operating system for service-first venues
        </div>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight text-balance max-w-4xl">
          Reservations, <span className="italic text-foreground/55">reimagined</span> for the modern dining room.
        </h1>
        <p className="mt-8 max-w-2xl text-lg md:text-xl text-muted-foreground text-pretty">
          Orchestrate every seat, every guest, every service. Premium floor planning, intelligent
          occupancy, and effortless guest communication — in one focused workspace.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/staff/login" className="inline-flex h-12 items-center gap-2 rounded-xl bg-foreground px-6 text-sm font-medium text-background shadow-elevated hover:opacity-90 transition-opacity">
            Open your dashboard <ArrowRight className="size-4" />
          </Link>
          <Link to="/book" className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-medium hover:bg-muted">
            See the guest experience
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Invite-only beta · White-glove onboarding · Cancel anytime
        </p>
      </div>
    </section>
  );
}

function TrustStrip() {
  const venues = ["LUMIÈRE", "AOKI & SONS", "TERRACE GROUP", "THE GILDED FORK", "AURA LOUNGE", "VANTAGE"];
  return (
    <section className="px-6 md:px-10 py-10 border-y border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Built with the next generation of hospitality
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-50">
          {venues.map((v) => (
            <span key={v} className="font-serif text-lg tracking-[0.15em]">{v}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: LayoutGrid, title: "Visual floor orchestration", body: "Drag-and-drop tables, merge for parties, watch statuses update in real time. Every seat, accounted for." },
    { icon: MessageCircle, title: "Effortless guest comms", body: "Confirmations, reminders, and waitlist alerts — sent on the channel your guests actually read." },
    { icon: Shield, title: "Deposit protection", body: "Custom cancellation rules and deposit policies eliminate no-shows by up to 78%." },
    { icon: Users, title: "Guest intelligence CRM", body: "Visit history, preferred tables, allergies, lifetime value. Recognise every guest before they arrive." },
    { icon: Sparkles, title: "Quietly intelligent", body: "Occupancy forecasting and smart scheduling that nudges — never interrupts — your service." },
    { icon: LineChart, title: "Operator-grade analytics", body: "Cohort retention, source attribution, no-show curves, profit per cover — the metrics that matter." },
  ];

  return (
    <section id="features" className="px-6 md:px-10 py-24 max-w-7xl mx-auto">
      <div className="max-w-2xl mb-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-4">The platform</p>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight text-balance">
          Everything a modern dining room needs.{" "}
          <span className="italic text-foreground/55">Nothing it doesn't.</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-3xl overflow-hidden border border-border">
        {features.map((f) => (
          <div key={f.title} className="bg-card p-8 hover:bg-muted/30 transition-colors">
            <div className="size-10 rounded-xl bg-foreground text-background grid place-items-center mb-6">
              <f.icon className="size-5" />
            </div>
            <h3 className="text-base font-medium mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section className="px-6 md:px-10 py-24 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-4">Floor plan studio</p>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-6 text-balance">
            Map your venue as it is —{" "}
            <span className="italic text-foreground/55">not as software assumes.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Round tables, banquettes, chef's counter, terrace, private rooms. Configure shape,
            capacity, and merge rules. SeatFlow respects how your maître d' actually seats a room.
          </p>
          <ul className="space-y-3">
            {[
              "Multi-room layouts with custom shapes",
              "Smart merge rules and party combinations",
              "Per-table minimums, deposits, dwell time",
              "Live timeline and turn forecasting",
            ].map((i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Check className="size-4 mt-0.5 text-success shrink-0" />
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-elevated grid-dots">
          <div className="grid grid-cols-3 gap-4">
            {[
              { l: "T-01", s: "available" },
              { l: "T-02", s: "reserved" },
              { l: "T-03", s: "occupied" },
              { l: "VIP-1", s: "vip" },
              { l: "T-05", s: "cleaning" },
              { l: "T-06", s: "available" },
            ].map((t) => (
              <div
                key={t.l}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-center text-xs font-semibold tnum ${
                  t.s === "available" ? "bg-muted/60 border border-dashed border-border text-muted-foreground" :
                  t.s === "reserved" ? "bg-accent/15 border border-accent/30" :
                  t.s === "occupied" ? "bg-foreground text-background" :
                  t.s === "vip" ? "bg-foreground text-background ring-1 ring-accent/60" :
                  "bg-success/10 text-success border border-success/25"
                }`}
              >
                {t.l}
                <span className="text-[9px] mt-1 opacity-60 tracking-[0.15em]">{t.s.toUpperCase()}</span>
              </div>
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-background/50 mb-4">Guest communication</p>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-6">
            The conversations that{" "}
            <span className="italic text-background/60">protect your revenue.</span>
          </h2>
          <p className="text-background/70 leading-relaxed mb-6">
            Every confirmation, reminder and late-arrival nudge — sent on the channel guests
            actually read. White-labelled to your brand, calm and on-tone.
          </p>
          <Link to="/book" className="inline-flex h-11 items-center gap-2 rounded-lg bg-background text-foreground px-5 text-sm font-medium hover:opacity-90">
            See it in action <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {[
            { from: "Lumière", body: "Hello Elena, your table for 2 at 18:30 tonight is confirmed. Reply 1 to keep, 2 to cancel.", time: "Sent automatically · 24h before" },
            { from: "Elena", body: "1", time: "Confirmed · no-show risk: 0%", mine: true },
            { from: "Lumière", body: "Thank you Elena. Pier-side window held for you. See you tonight.", time: "Sent automatically" },
          ].map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-2xl p-4 text-sm ${m.mine ? "ml-auto bg-accent text-accent-foreground rounded-br-sm" : "bg-background/10 text-background rounded-bl-sm"}`}>
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-4">Pricing</p>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight">Built to scale with you.</h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          A monthly subscription plus a small per-booking fee. No setup, no contract, cancel anytime.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-3xl p-8 flex flex-col ${p.featured ? "bg-foreground text-background shadow-elevated" : "bg-card border border-border"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{p.name}</span>
              {p.featured && <span className="rounded-full bg-accent text-accent-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">Most chosen</span>}
            </div>
            <div className="font-serif text-5xl italic mb-1 tnum">
              {p.price}
              {p.price !== "Custom" && <span className="not-italic text-sm font-sans opacity-60"> /mo</span>}
            </div>
            <p className={`text-sm mb-6 ${p.featured ? "text-background/60" : "text-muted-foreground"}`}>{p.blurb}</p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className={`size-4 mt-0.5 shrink-0 ${p.featured ? "text-background/80" : "text-success"}`} />
                  {f}
                </li>
              ))}
            </ul>
            <div className={`text-xs mb-4 ${p.featured ? "text-background/60" : "text-muted-foreground"}`}>+ {p.fee}</div>
            <Link to="/staff/login" className={`h-11 rounded-xl text-sm font-medium grid place-items-center ${p.featured ? "bg-background text-foreground hover:opacity-90" : "bg-foreground text-background hover:opacity-90"}`}>
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { q: "Our hostesses understood the system in under 10 minutes. That alone is worth the switch.", n: "Camille Aubert", r: "GM, Lumière" },
    { q: "It's the first reservation platform that feels designed for hospitality, not extraction.", n: "Tomasz Wieczorek", r: "Founder, Aoki & Sons" },
    { q: "The CRM is what makes return guests feel seen. That's worth ten OpenTables.", n: "Naledi Okafor", r: "Ops Director, Terrace Group" },
  ];
  return (
    <section className="px-6 md:px-10 py-24 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quotes.map((q) => (
          <figure key={q.n} className="rounded-3xl border border-border bg-card p-8">
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-accent text-accent" />
              ))}
            </div>
            <blockquote className="font-serif italic text-xl leading-snug mb-6">"{q.q}"</blockquote>
            <figcaption className="text-sm">
              <div className="font-medium">{q.n}</div>
              <div className="text-muted-foreground text-xs">{q.r}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "How long does onboarding take?", a: "Most restaurants are live within 30 minutes. We migrate your floor plan and import existing reservations for free." },
    { q: "Can guests book without an app?", a: "Yes. SeatFlow ships a white-label widget, QR codes, and an Instagram-ready link. One reservation flow, every channel." },
    { q: "How do deposits and refunds work?", a: "Native processing with custom cancellation policies. Refund in one click, partial refunds, or auto-charge no-shows after a grace window." },
    { q: "Do you charge per cover?", a: "Per confirmed booking only — never per cover, never per cancellation. You always know what you're paying for." },
    { q: "Is there a multi-location plan?", a: "Premium includes the multi-venue HQ: shared CRM, cross-venue analytics, and unified billing." },
  ];
  return (
    <section id="faq" className="px-6 md:px-10 py-24 max-w-3xl mx-auto">
      <h2 className="font-serif text-4xl md:text-5xl text-center mb-12">Frequently asked.</h2>
      <div className="divide-y divide-border border-y border-border">
        {items.map((i) => (
          <details key={i.q} className="group py-6">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <span className="font-medium">{i.q}</span>
              <span className="font-serif text-2xl italic text-muted-foreground group-open:rotate-45 transition-transform">+</span>
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
          Join the restaurants designing the next decade of hospitality.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/staff/login" className="inline-flex h-12 items-center gap-2 rounded-xl bg-background text-foreground px-6 text-sm font-medium hover:opacity-90">
            Sign in <ArrowRight className="size-4" />
          </Link>
          <a href="#pricing" className="inline-flex h-12 items-center rounded-xl border border-background/20 px-6 text-sm font-medium hover:bg-background/10">
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
            Designed for service. © {new Date().getFullYear()} SeatFlow.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-12 text-sm">
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Product</div>
            <a href="#features" className="block hover:text-foreground/80">Platform</a>
            <a href="#pricing" className="block hover:text-foreground/80">Pricing</a>
            <Link to="/staff/login" className="block hover:text-foreground/80">Dashboard</Link>
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
