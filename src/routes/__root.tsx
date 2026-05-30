import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl italic">404</h1>
        <h2 className="mt-4 font-medium text-foreground">This page doesn't exist</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for may have moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl italic">Something didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
          <a href="/" className="h-10 px-4 inline-flex items-center rounded-lg border border-border text-sm font-medium hover:bg-muted">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SeatFlow — A premium operating system for modern restaurants" },
      { name: "description", content: "SeatFlow is the calm, premium reservation, floor plan and guest CRM for ambitious restaurants. Reduce no-shows, automate guest communication, and orchestrate every service." },
      { name: "author", content: "SeatFlow" },
      { property: "og:title", content: "SeatFlow — Reservations, reimagined" },
      { property: "og:description", content: "Premium reservation, floor plan and guest CRM platform for modern restaurants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('seatflow.theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster position="top-right" toastOptions={{ className: "!bg-card !text-foreground !border-border" }} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
