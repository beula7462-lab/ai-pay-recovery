import { useSyncExternalStore } from "react";
import { PAYMENTS, type Payment, type PaymentStatus } from "./demo-data";

export type ActionKind = "retry" | "payment_link" | "reminder";

let state: Payment[] = PAYMENTS.map((p) => ({ ...p, activity: [...p.activity] }));

const listeners = new Set<() => void>();

function emit() {
  state = [...state];
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return state;
}

export function usePayments(): Payment[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function usePayment(id: string): Payment | undefined {
  return usePayments().find((p) => p.id === id);
}

export const ACTION_LABEL: Record<ActionKind, string> = {
  retry: "Retry Payment",
  payment_link: "Send Payment Link",
  reminder: "Schedule Reminder",
};

export interface ActionResult {
  ok: boolean;
  status: PaymentStatus;
  title: string;
  detail: string;
}

/**
 * Simulates the AI agent executing a recovery action against a synthetic
 * payment. Outcome is derived deterministically from the recovery score so
 * the demo behaves consistently.
 */
export function executeAction(id: string, action: ActionKind): ActionResult {
  const payment = state.find((p) => p.id === id);
  if (!payment) {
    return { ok: false, status: "failed", title: "Payment not found", detail: "" };
  }

  const boost = action === payment.recommendedAction ? 12 : -6;
  const score = payment.probability + boost;
  const now = new Date().toISOString();

  let status: PaymentStatus;
  let title: string;
  let detail: string;

  if (action === "retry") {
    if (score >= 65) {
      status = "recovered";
      title = "Payment recovered";
      detail = `Retry authorised on ${payment.method} — ${fmt(payment.amount)} settled for ${payment.customer}.`;
    } else {
      status = "in_recovery";
      title = "Retry scheduled";
      detail = `Issuer declined the immediate retry. AI queued a smart retry in the next high-success window.`;
    }
  } else if (action === "payment_link") {
    if (score >= 55) {
      status = "recovered";
      title = "Paid via recovery link";
      detail = `${payment.customer} completed ${fmt(payment.amount)} through the secure payment link.`;
    } else {
      status = "in_recovery";
      title = "Payment link sent";
      detail = `Secure link delivered to ${payment.email}. Awaiting customer action.`;
    }
  } else {
    status = "in_recovery";
    title = "Reminder scheduled";
    detail = `Multi-channel reminder queued for ${payment.customer} ahead of the next retry window.`;
  }

  const next: Payment = {
    ...payment,
    status,
    attempts: action === "retry" ? payment.attempts + 1 : payment.attempts,
    probability: Math.max(5, Math.min(99, status === "recovered" ? 100 : score)),
    activity: [
      ...payment.activity,
      { id: `${payment.id}-${payment.activity.length}`, at: now, label: `${ACTION_LABEL[action]} executed — ${title}` },
    ],
  };

  state = state.map((p) => (p.id === id ? next : p));
  emit();

  return { ok: true, status, title, detail };
}

export function resetDemo() {
  state = PAYMENTS.map((p) => ({ ...p, activity: [...p.activity] }));
  emit();
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
}

export interface Metrics {
  atRisk: number;
  recovered: number;
  recoveryRate: number;
  failedCount: number;
  inRecovery: number;
  recoveredCount: number;
  totalCount: number;
}

export function computeMetrics(payments: Payment[]): Metrics {
  const total = payments.reduce((s, p) => s + p.amount, 0);
  const recovered = payments
    .filter((p) => p.status === "recovered")
    .reduce((s, p) => s + p.amount, 0);
  const atRisk = total - recovered;
  return {
    atRisk,
    recovered,
    recoveryRate: total === 0 ? 0 : (recovered / total) * 100,
    failedCount: payments.filter((p) => p.status === "failed").length,
    inRecovery: payments.filter((p) => p.status === "in_recovery").length,
    recoveredCount: payments.filter((p) => p.status === "recovered").length,
    totalCount: payments.length,
  };
}

/** Queue priority = expected recoverable value. */
export function priorityScore(p: Payment): number {
  return (p.amount * p.probability) / 100;
}
