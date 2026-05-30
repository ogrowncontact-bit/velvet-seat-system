// Re-exported shared types only. All real data comes from Lovable Cloud.
export type TableStatus =
  | "available"
  | "reserved"
  | "occupied"
  | "cleaning"
  | "vip"
  | "delayed";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "no_show"
  | "cancelled";

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
