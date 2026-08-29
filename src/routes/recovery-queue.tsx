import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Link2, BellRing, Bot, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, StatCard } from "@/components/recovery-ui";
import { formatINR, formatCompactINR } from "@/lib/demo-data";
import {
  usePayments,
  executeAction,
  priorityScore,
  computeMetrics,
  ACTION_LABEL,
  type ActionKind,
} from "@/lib/recovery-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/recovery-queue")({
  head: () => ({
    meta: [
      { title: "AI Recovery Queue — PayRecover AI" },
      {
        name: "description",
        content:
          "Priority-ranked recovery queue where the AI agent retries payments, sends payment links and schedules reminders for failed transactions.",
      },
      { property: "og:title", content: "AI Recovery Queue — PayRecover AI" },
      {
        property: "og:description",
        content: "Execute retries, payment links and reminders from a priority-ranked recovery queue.",
      },
    ],
  }),
  component: RecoveryQueue,
});

function RecoveryQueue() {
  const payments = usePayments();
  const m = computeMetrics(payments);

  const queue = [...payments]
    .filter((p) => p.status !== "recovered")
    .sort((a, b) => priorityScore(b) - priorityScore(a));

  const run = (id: string, action: ActionKind) => {
    const res = executeAction(id, action);
    if (res.status === "recovered") toast.success(res.title, { description: res.detail });
    else toast.info(res.title, { description: res.detail });
  };

  const runAllHighConfidence = () => {
    const targets = queue.filter((p) => p.probability >= 75);
    if (targets.length === 0) {
      toast.info("No high-confidence items", {
        description: "The queue has no transactions scoring above 75% right now.",
      });
      return;
    }
    let recovered = 0;
    targets.forEach((p) => {
      const res = executeAction(p.id, p.recommendedAction);
      if (res.status === "recovered") recovered += p.amount;
    });
    toast.success(`Agent processed ${targets.length} transactions`, {
      description: `${formatINR(recovered)} recovered in this batch.`,
    });
  };

  return (
    <AppShell
      title="AI Recovery Queue"
      subtitle="Transactions ranked by expected recoverable value. The agent proposes a playbook per item — execute it or override."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Queued transactions" value={String(queue.length)} sub="Awaiting or in recovery" />
        <StatCard
          label="Recoverable value"
          value={formatCompactINR(queue.reduce((s, p) => s + priorityScore(p), 0))}
          sub="Probability-weighted forecast"
          tone="warning"
        />
        <StatCard
          label="Recovered so far"
          value={formatINR(m.recovered)}
          sub={`${m.recoveryRate.toFixed(1)}% recovery rate`}
          tone="success"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 panel p-4">
        <div className="flex items-center gap-2 text-sm">
          <Bot className="size-4 text-accent" />
          Autonomous batch: execute every recommended playbook scoring above 75%.
        </div>
        <Button onClick={runAllHighConfidence} disabled={queue.length === 0}>
          <Zap className="size-4" /> Run agent on high-confidence items
        </Button>
      </div>

      <div className="mt-5 space-y-4">
        {queue.map((p, idx) => (
          <article key={p.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 font-mono text-xs">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/transaction/$id"
                      params={{ id: p.id }}
                      className="text-sm font-semibold hover:text-accent"
                    >
                      {p.customer}
                    </Link>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {p.id} · {p.method} · {p.reason} · {p.attempts} attempt(s)
                  </p>
                  <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-accent">
                      AI playbook — {ACTION_LABEL[p.recommendedAction]}:
                    </span>{" "}
                    {p.recommendation}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-display text-xl font-semibold">{formatINR(p.amount)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.probability}% likely · expected {formatCompactINR(priorityScore(p))}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Button size="sm" onClick={() => run(p.id, "retry")}>
                <Zap className="size-3.5" /> Retry Payment
              </Button>
              <Button size="sm" variant="outline" onClick={() => run(p.id, "payment_link")}>
                <Link2 className="size-3.5" /> Send Payment Link
              </Button>
              <Button size="sm" variant="outline" onClick={() => run(p.id, "reminder")}>
                <BellRing className="size-3.5" /> Schedule Reminder
              </Button>
              <Link
                to="/transaction/$id"
                params={{ id: p.id }}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                Full analysis <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </article>
        ))}

        {queue.length === 0 && (
          <div className="panel p-10 text-center">
            <p className="text-sm font-medium text-success">Queue cleared</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Every synthetic failed payment has been recovered. Reset the demo from the dashboard.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
