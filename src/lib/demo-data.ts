// Shared demo data for the SeatFlow app preview.
// Static, deterministic — used across dashboard, bookings, CRM, analytics.

export type TableStatus =
  | "available"
  | "reserved"
  | "occupied"
  | "cleaning"
  | "vip"
  | "delayed";

export interface FloorTable {
  id: string;
  label: string;
  seats: number;
  status: TableStatus;
  shape: "round" | "square" | "rect";
  col: number;
  row: number;
  span?: number;
  guest?: string;
  note?: string;
}

export const floorTables: FloorTable[] = [
  { id: "t01", label: "T-01", seats: 4, status: "available", shape: "round", col: 1, row: 1 },
  { id: "t02", label: "T-02", seats: 2, status: "reserved", shape: "square", col: 2, row: 1, guest: "Elena Rossi" },
  { id: "t03", label: "T-03", seats: 4, status: "occupied", shape: "square", col: 3, row: 1, guest: "Party of 4" },
  { id: "t04", label: "T-04", seats: 2, status: "available", shape: "round", col: 4, row: 1 },
  { id: "t05", label: "VIP-1", seats: 6, status: "vip", shape: "rect", col: 1, row: 2, span: 2, guest: "Julianne Moore" },
  { id: "t06", label: "T-06", seats: 4, status: "cleaning", shape: "round", col: 3, row: 2 },
  { id: "t07", label: "T-07", seats: 2, status: "available", shape: "square", col: 4, row: 2 },
  { id: "t08", label: "T-08", seats: 4, status: "delayed", shape: "square", col: 1, row: 3, guest: "M. Chen — 12 min late" },
  { id: "t09", label: "T-09", seats: 2, status: "available", shape: "round", col: 2, row: 3 },
  { id: "t10", label: "T-10", seats: 8, status: "reserved", shape: "rect", col: 3, row: 3, span: 2, guest: "Hartmann +7" },
];

export const stats = [
  { label: "Occupancy", value: "84%", delta: "+12%", positive: true },
  { label: "Estimated Revenue", value: "$12,480", delta: "80% deposits", positive: true },
  { label: "Covers Remaining", value: "42", delta: "from 11 bookings", positive: true },
  { label: "No-Show Risk", value: "1.2%", delta: "−0.5%", positive: true },
];

export interface Reservation {
  id: string;
  time: string;
  guest: string;
  party: number;
  table: string;
  status: "confirmed" | "seated" | "pending" | "cancelled" | "waitlist";
  source: "Widget" | "Instagram" | "Google" | "Phone" | "Walk-in";
  notes?: string;
  deposit?: number;
}

export const reservations: Reservation[] = [
  { id: "r1", time: "18:30", guest: "Elena Rossi", party: 2, table: "T-02", status: "confirmed", source: "Widget", notes: "Anniversary", deposit: 40 },
  { id: "r2", time: "19:00", guest: "Hartmann Group", party: 8, table: "T-10", status: "confirmed", source: "Phone", notes: "Corporate dinner", deposit: 200 },
  { id: "r3", time: "19:15", guest: "Julianne Moore", party: 6, table: "VIP-1", status: "confirmed", source: "Phone", notes: "VIP — pinot reserve", deposit: 150 },
  { id: "r4", time: "19:30", guest: "Marcus Chen", party: 4, table: "T-08", status: "seated", source: "Widget", notes: "Allergy: shellfish" },
  { id: "r5", time: "20:00", guest: "Park family", party: 5, table: "T-12", status: "confirmed", source: "Google", deposit: 100 },
  { id: "r6", time: "20:30", guest: "Sarah Jenkins", party: 2, table: "—", status: "waitlist", source: "Widget" },
  { id: "r7", time: "20:45", guest: "D. Okafor", party: 3, table: "T-07", status: "pending", source: "Instagram", notes: "Birthday cake at 21:15" },
  { id: "r8", time: "21:00", guest: "Whitney + 1", party: 2, table: "T-04", status: "confirmed", source: "Widget", deposit: 30 },
  { id: "r9", time: "21:30", guest: "Aoki party", party: 4, table: "T-03", status: "cancelled", source: "Widget" },
];

export interface VipGuest {
  id: string;
  name: string;
  tag: "VIP" | "High Spender" | "Recurring" | "No-Show Risk";
  visits: number;
  spend: string;
  next?: string;
}

export const vipGuests: VipGuest[] = [
  { id: "g1", name: "Julianne Moore", tag: "High Spender", visits: 14, spend: "$8,240", next: "Tonight · 19:15" },
  { id: "g2", name: "Marcus Chen", tag: "Recurring", visits: 22, spend: "$5,910", next: "Tonight · 19:30" },
  { id: "g3", name: "Elena Rossi", tag: "VIP", visits: 9, spend: "$3,180", next: "Tonight · 18:30" },
  { id: "g4", name: "D. Okafor", tag: "Recurring", visits: 7, spend: "$2,040", next: "Tonight · 20:45" },
  { id: "g5", name: "S. Karimov", tag: "No-Show Risk", visits: 3, spend: "$610" },
];

export const activity = [
  { id: "a1", text: "WhatsApp confirmation sent to Elena Rossi", time: "2 min ago", tone: "accent" as const },
  { id: "a2", text: "Table 04 checked out · $412.00", time: "12 min ago", tone: "primary" as const },
  { id: "a3", text: "Waitlist alert: Sarah J. notified for T-08", time: "25 min ago", tone: "muted" as const },
  { id: "a4", text: "Deposit collected from Hartmann Group · $200", time: "38 min ago", tone: "success" as const },
  { id: "a5", text: "Aoki party cancelled · refund issued", time: "1 hr ago", tone: "destructive" as const },
];

// Hourly bookings for the analytics sparkline
export const hourlyBookings = [
  { hour: "17", value: 6 },
  { hour: "18", value: 12 },
  { hour: "19", value: 22 },
  { hour: "20", value: 28 },
  { hour: "21", value: 19 },
  { hour: "22", value: 9 },
  { hour: "23", value: 4 },
];

export const weekRevenue = [
  { day: "Mon", value: 4200 },
  { day: "Tue", value: 5100 },
  { day: "Wed", value: 6300 },
  { day: "Thu", value: 8200 },
  { day: "Fri", value: 12480 },
  { day: "Sat", value: 14200 },
  { day: "Sun", value: 9800 },
];

export const plans = [
  {
    name: "Starter",
    price: "$99",
    blurb: "For new venues finding their rhythm.",
    features: ["Up to 20 tables", "Booking widget", "Email confirmations", "Basic CRM", "1 location"],
    fee: "$0.45 per confirmed booking",
    cta: "Start free trial",
    featured: false,
  },
  {
    name: "Pro",
    price: "$249",
    blurb: "For full-service restaurants with high turn.",
    features: [
      "Unlimited tables",
      "WhatsApp & SMS automation",
      "Stripe deposit protection",
      "Guest intelligence CRM",
      "AI occupancy forecasting",
      "Up to 3 locations",
    ],
    fee: "$0.35 per confirmed booking",
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Premium",
    price: "Custom",
    blurb: "For multi-unit groups & hospitality brands.",
    features: [
      "Multi-location HQ",
      "White-label widget & domains",
      "POS & loyalty integrations",
      "Dedicated success manager",
      "Priority SLA",
    ],
    fee: "$0.25 per confirmed booking",
    cta: "Talk to sales",
    featured: false,
  },
];
