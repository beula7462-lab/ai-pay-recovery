// SYNTHETIC DEMO DATA ONLY — no real customers, no real payments.

export type PaymentStatus = "failed" | "in_recovery" | "recovered" | "lost";

export type RecoveryAction =
  | "retry"
  | "payment_link"
  | "reminder"
  | "execute";

export type FailureReason =
  | "Insufficient Funds"
  | "Card Expired"
  | "Bank Server Down"
  | "3DS Authentication Failed"
  | "UPI Timeout"
  | "Daily Limit Exceeded"
  | "Do Not Honour"
  | "Mandate Revoked";

export type PaymentMethod =
  | "UPI"
  | "Credit Card"
  | "Debit Card"
  | "Net Banking"
  | "Wallet"
  | "eNACH Mandate";

export interface ActivityEntry {
  id: string;
  at: string;
  label: string;
}

export interface Payment {
  id: string;
  customer: string;
  customerId: string;
  email: string;
  amount: number;
  method: PaymentMethod;
  reason: FailureReason;
  failedAt: string;
  attempts: number;
  probability: number; // 0-100
  status: PaymentStatus;
  plan: string;
  recommendation: string;
  recommendedAction: Exclude<RecoveryAction, "execute">;
  activity: ActivityEntry[];
}

const RECOMMENDATIONS: Record<
  FailureReason,
  { text: string; action: Exclude<RecoveryAction, "execute"> }
> = {
  "Insufficient Funds": {
    text: "Balance-failure pattern detected. Schedule a smart retry aligned to the customer's salary credit window (1st–3rd of month) and pre-notify via reminder.",
    action: "reminder",
  },
  "Card Expired": {
    text: "Stored card credentials are stale. Send a tokenised card-update payment link; retrying the same instrument will fail again.",
    action: "payment_link",
  },
  "Bank Server Down": {
    text: "Issuer-side outage — transient. Auto-retry in the next 30-minute window; historical success for this issuer is high.",
    action: "retry",
  },
  "3DS Authentication Failed": {
    text: "Customer abandoned OTP step. Send a fresh payment link with a lower-friction UPI-first checkout.",
    action: "payment_link",
  },
  "UPI Timeout": {
    text: "Collect request expired unactioned. Immediate retry with a shorter TTL plus a reminder nudge lifts conversion.",
    action: "retry",
  },
  "Daily Limit Exceeded": {
    text: "Per-day transfer cap hit. Schedule the retry for the next calendar day and notify the customer beforehand.",
    action: "reminder",
  },
  "Do Not Honour": {
    text: "Issuer risk decline. Do not hard-retry — route the customer to an alternate method through a payment link.",
    action: "payment_link",
  },
  "Mandate Revoked": {
    text: "Auto-debit mandate is no longer active. Send a payment link to settle the dues and re-authorise the mandate.",
    action: "payment_link",
  },
};

interface Seed {
  customer: string;
  email: string;
  amount: number;
  method: PaymentMethod;
  reason: FailureReason;
  failedAt: string;
  attempts: number;
  probability: number;
  plan: string;
}

const SEEDS: Seed[] = [
  { customer: "Aarav Mehta", email: "aarav.demo@example.in", amount: 24999, method: "UPI", reason: "UPI Timeout", failedAt: "2026-08-29T04:12:00Z", attempts: 1, probability: 88, plan: "Growth Annual" },
  { customer: "Ishita Rao", email: "ishita.demo@example.in", amount: 149000, method: "Credit Card", reason: "Do Not Honour", failedAt: "2026-08-29T02:48:00Z", attempts: 2, probability: 41, plan: "Enterprise Quarterly" },
  { customer: "Kabir Sethi", email: "kabir.demo@example.in", amount: 7499, method: "Debit Card", reason: "Insufficient Funds", failedAt: "2026-08-28T21:05:00Z", attempts: 3, probability: 63, plan: "Starter Monthly" },
  { customer: "Meera Nair", email: "meera.demo@example.in", amount: 58900, method: "eNACH Mandate", reason: "Mandate Revoked", failedAt: "2026-08-28T18:30:00Z", attempts: 1, probability: 52, plan: "Business Monthly" },
  { customer: "Rohan Iyer", email: "rohan.demo@example.in", amount: 12500, method: "Credit Card", reason: "Card Expired", failedAt: "2026-08-28T15:20:00Z", attempts: 2, probability: 74, plan: "Growth Monthly" },
  { customer: "Ananya Ghosh", email: "ananya.demo@example.in", amount: 3499, method: "Wallet", reason: "Insufficient Funds", failedAt: "2026-08-28T12:02:00Z", attempts: 1, probability: 69, plan: "Starter Monthly" },
  { customer: "Vikram Desai", email: "vikram.demo@example.in", amount: 210000, method: "Net Banking", reason: "Bank Server Down", failedAt: "2026-08-28T09:44:00Z", attempts: 1, probability: 91, plan: "Enterprise Annual" },
  { customer: "Sanya Kapoor", email: "sanya.demo@example.in", amount: 18750, method: "UPI", reason: "Daily Limit Exceeded", failedAt: "2026-08-27T19:16:00Z", attempts: 2, probability: 78, plan: "Growth Monthly" },
  { customer: "Devansh Patel", email: "devansh.demo@example.in", amount: 44500, method: "Credit Card", reason: "3DS Authentication Failed", failedAt: "2026-08-27T16:38:00Z", attempts: 1, probability: 66, plan: "Business Monthly" },
  { customer: "Priya Menon", email: "priya.demo@example.in", amount: 9999, method: "UPI", reason: "UPI Timeout", failedAt: "2026-08-27T11:27:00Z", attempts: 1, probability: 84, plan: "Starter Annual" },
  { customer: "Arjun Bhatia", email: "arjun.demo@example.in", amount: 76000, method: "Debit Card", reason: "Insufficient Funds", failedAt: "2026-08-26T22:10:00Z", attempts: 4, probability: 34, plan: "Business Quarterly" },
  { customer: "Nikita Shah", email: "nikita.demo@example.in", amount: 33200, method: "Net Banking", reason: "Bank Server Down", failedAt: "2026-08-26T14:55:00Z", attempts: 1, probability: 87, plan: "Growth Quarterly" },
  { customer: "Yash Chandra", email: "yash.demo@example.in", amount: 5299, method: "Wallet", reason: "Do Not Honour", failedAt: "2026-08-26T10:31:00Z", attempts: 2, probability: 38, plan: "Starter Monthly" },
  { customer: "Tara Krishnan", email: "tara.demo@example.in", amount: 99000, method: "eNACH Mandate", reason: "Mandate Revoked", failedAt: "2026-08-25T20:09:00Z", attempts: 1, probability: 57, plan: "Enterprise Monthly" },
  { customer: "Imran Qureshi", email: "imran.demo@example.in", amount: 15600, method: "Credit Card", reason: "Card Expired", failedAt: "2026-08-25T13:47:00Z", attempts: 3, probability: 71, plan: "Growth Monthly" },
  { customer: "Riya Sharma", email: "riya.demo@example.in", amount: 27400, method: "UPI", reason: "3DS Authentication Failed", failedAt: "2026-08-25T08:23:00Z", attempts: 1, probability: 61, plan: "Business Monthly" },
];

export const PAYMENTS: Payment[] = SEEDS.map((s, i) => {
  const rec = RECOMMENDATIONS[s.reason];
  return {
    id: `TXN-2026-${String(4100 + i * 7)}`,
    customerId: `CUS-${String(9100 + i * 3)}`,
    customer: s.customer,
    email: s.email,
    amount: s.amount,
    method: s.method,
    reason: s.reason,
    failedAt: s.failedAt,
    attempts: s.attempts,
    probability: s.probability,
    status: "failed" as PaymentStatus,
    plan: s.plan,
    recommendation: rec.text,
    recommendedAction: rec.action,
    activity: [
      { id: `${i}-a`, at: s.failedAt, label: `Payment declined by issuer — ${s.reason}` },
      { id: `${i}-b`, at: s.failedAt, label: "PayRecover AI scored the transaction and queued a recovery strategy" },
    ],
  };
});

// Historical baseline (synthetic) used by Analytics charts.
export const HISTORY = [
  { month: "Mar", atRisk: 1420000, recovered: 812000 },
  { month: "Apr", atRisk: 1685000, recovered: 1004000 },
  { month: "May", atRisk: 1531000, recovered: 968000 },
  { month: "Jun", atRisk: 1890000, recovered: 1273000 },
  { month: "Jul", atRisk: 2045000, recovered: 1462000 },
  { month: "Aug", atRisk: 2260000, recovered: 1701000 },
];

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return formatINR(value);
}
