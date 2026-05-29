import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="font-serif text-4xl md:text-5xl italic">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Venue, team, integrations</p>
      </header>

      <Section title="Venue">
        <Field label="Restaurant name" value="Lumière" />
        <Field label="Address" value="Calle del Prado 14, Madrid" />
        <Field label="Timezone" value="Europe/Madrid (UTC+1)" />
        <Field label="Reservation lead time" value="30 minutes" />
      </Section>

      <Section title="Team">
        <Person name="Camille Aubert" role="Owner" email="camille@lumiere.es" />
        <Person name="Tomás Riera" role="Manager" email="tomas@lumiere.es" />
        <Person name="Sofía Morales" role="Hostess" email="sofia@lumiere.es" />
      </Section>

      <Section title="Integrations">
        <Integration name="WhatsApp Business" status="Connected" />
        <Integration name="Stripe payments" status="Connected" />
        <Integration name="Google Reserve" status="Connected" />
        <Integration name="Instagram bio link" status="Connected" />
        <Integration name="POS · Square" status="Coming soon" muted />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="font-medium">{title}</h2>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Person({ name, role, email }: { name: string; role: string; email: string }) {
  return (
    <div className="flex items-center justify-between p-5">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-medium">
          {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-muted-foreground">{email}</div>
        </div>
      </div>
      <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider">{role}</span>
    </div>
  );
}

function Integration({ name, status, muted = false }: { name: string; status: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between p-5 text-sm">
      <span className={muted ? "text-muted-foreground" : ""}>{name}</span>
      <span
        className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
          muted ? "bg-muted text-muted-foreground" : "bg-success/10 text-success"
        }`}
      >
        {status}
      </span>
    </div>
  );
}
