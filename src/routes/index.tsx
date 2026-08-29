import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingDown,
  TrendingUp,
  Percent,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard, StatusBadge, ProbabilityBar } from "@/components/recovery-ui";
import { formatINR, formatCompactINR } from "@/lib/demo-data";
import {
  usePayments,
  computeMetrics,
  priorityScore,
  resetDemo,
} from "@/lib/recovery-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — PayRecover AI Revenue Recovery Agent" },
      {
        name: "description",
        content:
          "Live view of revenue at risk, recovered revenue, recovery rate and AI insights across failed payments in Indian Rupees.",
      },
      { property: "og:title", content: "PayRecover AI — Revenue Recovery Dashboard" },
      {
        property: "og:description",
        content: "Track revenue at risk, recovered revenue and AI-driven payment recovery insights.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const payments = usePayments();
  const m = computeMetrics(payments);

  const topOpportunities = [...payments]
    .filter((p) => p.status !== "recovered")
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 5);

  const byReason = Object.entries(
    payments.reduce<Record<string, number>>((acc, p) => {
      if (p.status !== "recovered") acc[p.reason] = (acc[p.reason] ?? 0) + p.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const insights = buildInsights(payments, m.recoveryRate, byReason);

  return (
    <AppShell
      title="Revenue Recovery Command Center"
      subtitle="Autonomous agent monitoring failed payments, scoring recoverability and executing recovery playbooks in real time."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue at Risk"
          value={formatINR(m.atRisk)}
          sub={`${m.failedCount + m.inRecovery} unsettled transactions`}
          tone="danger"
          icon={<TrendingDown className="size-4" />}
        />
        <StatCard
          label="Revenue Recovered"
          value={formatINR(m.recovered)}
          sub={`${m.recoveredCount} transactions settled by the agent`}
          tone="success"
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label="Recovery Rate"
          value={`${m.recoveryRate.toFixed(1)}%`}
          sub="Recovered value ÷ total failed value"
          tone={m.recoveryRate >= 40 ? "success" : "warning"}
          icon={<Percent className="size-4" />}
        />
        <StatCard
          label="Failed Payments"
          value={String(m.failedCount)}
          sub={`${m.inRecovery} currently in active recovery`}
          tone="warning"
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Top recovery opportunities</h2>
              <p className="text-xs text-muted-foreground">
                Ranked by expected recoverable value (amount × probability).
              </p>
            </div>
            <Link
              to="/recovery-queue"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              Open queue <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-border">
            {topOpportunities.map((p) => (
              <Link
                key={p.id}
                to="/transaction/$id"
                params={{ id: p.id }}
                className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-surface-2/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.customer}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {p.id} · {p.method} · {p.reason}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <ProbabilityBar value={p.probability} />
                  <span className="w-24 text-right font-mono text-sm">{formatINR(p.amount)}</span>
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            ))}
            {topOpportunities.length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">
                Every failed payment has been recovered. Reset the demo to run again.
              </p>
            )}
          </div>
        </section>

        <section className="panel p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            <h2 className="text-base font-semibold">AI Insights</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {insights.map((i) => (
              <li key={i.title} className="rounded-lg border border-border bg-surface-2/60 p-3">
                <p className="text-xs font-semibold text-accent">{i.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.body}</p>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => {
              resetDemo();
              toast.success("Demo data reset", {
                description: "All synthetic payments returned to failed state.",
              });
            }}
          >
            <RotateCcw className="size-3.5" /> Reset demo data
          </Button>
        </section>
      </div>

      <section className="panel mt-5 p-5">
        <h2 className="text-base font-semibold">At-risk revenue by failure reason</h2>
        <div className="mt-4 space-y-3">
          {byReason.map(([reason, amount]) => {
            const max = byReason[0]?.[1] ?? 1;
            return (
              <div key={reason} className="flex items-center gap-4">
                <span className="w-52 shrink-0 text-xs text-muted-foreground">{reason}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="brand-gradient-bg h-full rounded-full"
                    style={{ width: `${(amount / max) * 100}%` }}
                  />
                </div>
                <span className="w-24 text-right font-mono text-xs">{formatCompactINR(amount)}</span>
              </div>
            );
          })}
          {byReason.length === 0 && (
            <p className="text-sm text-muted-foreground">No outstanding at-risk revenue.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function buildInsights(
  payments: ReturnType<typeof usePayments>,
  rate: number,
  byReason: [string, number][],
) {
  const topReason = byReason[0];
  const highConfidence = payments.filter((p) => p.status !== "recovered" && p.probability >= 75);
  const highValue = [...payments]
    .filter((p) => p.status !== "recovered")
    .sort((a, b) => b.amount - a.amount)[0];

  const out = [
    {
      title: "Highest leakage driver",
      body: topReason
        ? `${topReason[0]} accounts for ${formatCompactINR(topReason[1])} of at-risk revenue. The agent is routing these to the matching playbook automatically.`
        : "No at-risk revenue remaining — all synthetic failures have been recovered.",
    },
    {
      title: "Quick wins available",
      body: `${highConfidence.length} transactions score above 75% recoverability, worth ${formatCompactINR(
        highConfidence.reduce((s, p) => s + p.amount, 0),
      )}. Executing them first maximises recovered revenue per action.`,
    },
    {
      title: "Priority escalation",
      body: highValue
        ? `${highValue.customer} (${formatINR(highValue.amount)}, ${highValue.plan}) is the largest open exposure — recommended action: ${labelFor(highValue.recommendedAction)}.`
        : "No escalations pending.",
    },
    {
      title: "Recovery trajectory",
      body: `Current recovery rate is ${rate.toFixed(1)}%. Every additional high-confidence retry lifts this figure and reduces revenue at risk instantly.`,
    },
  ];
  return out;
}

function labelFor(a: string) {
  return a === "retry" ? "Retry Payment" : a === "payment_link" ? "Send Payment Link" : "Schedule Reminder";
}
