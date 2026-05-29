import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, Users, Clock, Check } from "lucide-react";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a table — SeatFlow demo" },
      { name: "description", content: "Reserve your table — a glimpse of the guest experience SeatFlow delivers." },
    ],
  }),
  component: Book,
});

function Book() {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("Fri, Oct 24");
  const [time, setTime] = useState("19:30");
  const [party, setParty] = useState(2);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="h-16 border-b border-border bg-background flex items-center px-6 md:px-10 justify-between">
        <Link to="/" className="font-serif text-2xl font-medium">SeatFlow</Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-3">
            Lumière · Madrid
          </p>
          <h1 className="font-serif text-4xl md:text-5xl italic">Reserve your table</h1>
          <p className="mt-3 text-muted-foreground text-sm">
            A glimpse of the guest experience your restaurant ships with SeatFlow.
          </p>
        </div>

        <ol className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex items-center gap-3">
              <div
                className={`size-7 rounded-full grid place-items-center text-xs font-bold ${
                  step >= n ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                {step > n ? <Check className="size-3.5" /> : n}
              </div>
              {n < 3 && <div className={`w-12 h-px ${step > n ? "bg-foreground" : "bg-border"}`} />}
            </li>
          ))}
        </ol>

        <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl italic">When are you joining us?</h2>

              <div>
                <Label icon={<Calendar className="size-4" />}>Date</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {["Thu, Oct 23", "Fri, Oct 24", "Sat, Oct 25", "Sun, Oct 26", "Mon, Oct 27", "Tue, Oct 28"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDate(d)}
                      className={`py-3 rounded-lg text-xs font-medium border ${
                        date === d ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label icon={<Users className="size-4" />}>Party size</Label>
                <div className="flex gap-2 flex-wrap">
                  {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setParty(n)}
                      className={`size-10 rounded-lg text-sm font-medium border ${
                        party === n ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label icon={<Clock className="size-4" />}>Available times</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTime(t)}
                      className={`py-3 rounded-lg text-xs font-medium border ${
                        time === t ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-serif text-2xl italic">A few details</h2>
              {[
                { label: "Full name", placeholder: "Elena Rossi" },
                { label: "Phone", placeholder: "+34 612 345 678" },
                { label: "Email", placeholder: "elena@example.com" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
                    {f.label}
                  </label>
                  <input
                    placeholder={f.placeholder}
                    className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
                  Special occasion or notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Anniversary, allergies, accessibility…"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div className="rounded-xl bg-muted/60 p-4 text-xs text-muted-foreground">
                A $40 hold per guest will be authorised on your card. Cancel up to 24 h before with a full refund.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto size-14 rounded-full bg-success/15 text-success grid place-items-center">
                <Check className="size-7" />
              </div>
              <div>
                <h2 className="font-serif text-3xl italic">You're booked.</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Lumière is expecting you on <span className="text-foreground font-medium">{date}</span> at{" "}
                  <span className="text-foreground font-medium">{time}</span> for{" "}
                  <span className="text-foreground font-medium">{party}</span>.
                </p>
              </div>
              <div className="rounded-2xl border border-border p-5 text-left text-sm">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  WhatsApp confirmation preview
                </div>
                <p className="leading-relaxed">
                  Hello Elena, your table for {party} at {time} on {date} is confirmed at Lumière. Reply
                  <span className="font-semibold"> 1</span> to keep, <span className="font-semibold">2</span> to cancel.
                  We look forward to having you.
                </p>
              </div>
              <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-xl bg-foreground text-background px-5 text-sm font-medium hover:opacity-90">
                Back to SeatFlow
              </Link>
            </div>
          )}

          {step < 3 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 inline-flex items-center gap-1"
              >
                <ArrowLeft className="size-4" /> Back
              </button>
              <div className="text-xs text-muted-foreground">
                {date} · {time} · {party} guests
              </div>
              <button
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5"
              >
                {step === 2 ? "Confirm booking" : "Continue"} <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Label({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {icon} {children}
    </div>
  );
}
