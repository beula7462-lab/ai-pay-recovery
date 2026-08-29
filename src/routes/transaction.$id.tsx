import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Link2,
  BellRing,
  User,
  CreditCard,
  AlertOctagon,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/recovery-ui";
import { formatINR } from "@/lib/demo-data";
import { usePayment, executeAction, ACTION_LABEL, type ActionKind } from "@/lib/recovery-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/transaction/$id")({
  head: () => ({
    meta: [
      { title: "Transaction Analysis — PayRecover AI" },
      {
        name: "description",
        content:
          "AI transaction analysis with customer, amount, payment method, failure reason, recovery probability and a recommended recovery action.",
      },
      { property: "og:title", content: "Transaction Analysis — PayRecover AI" },
      {
        property: "og:description",
        content: "Deep AI analysis of a failed payment with an executable recovery recommendation.",
      },
    ],
  }),
  component: TransactionAnalysis,
});

function TransactionAnalysis() {
  const { id } = useParams({ from: "/transaction/$id" });
  const payment = usePayment(id);

  if (!payment) {
    return (
      <AppShell title="Transaction not found">
        <div className="panel p-8 text-sm text-muted-foreground">
          No synthetic transaction matches <span className="font-mono">{id}</span>.{" "}
          <Link to="/failed-payments" className="text-accent hover:underline">
            Back to failed payments
          </Link>
        </div>
      </AppShell>
    );
  }

  const run = (action: ActionKind) => {
    const res = executeAction(payment.id, action);
    if (res.status === "recovered") toast.success(res.title, { description: res.detail });
    else toast.info(res.title, { description: res.detail });
  };

  return (
    <AppShell
      title="Transaction Analysis"
      subtitle={`AI breakdown for ${payment.id} — synthetic record.`}
    >
      <Link
        to="/failed-payments"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to failed payments
      </Link>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{payment.id}</p>
                <h2 className="mt-1 font-display text-3xl font-semibold">
                  {formatINR(payment.amount)}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{payment.plan}</p>
              </div>
              <StatusBadge status={payment.status} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field icon={<User className="size-4" />} label="Customer">
                <p className="font-medium">{payment.customer}</p>
                <p className="text-xs text-muted-foreground">
                  {payment.customerId} · {payment.email}
                </p>
              </Field>
              <Field icon={<CreditCard className="size-4" />} label="Payment method">
                <p className="font-medium">{payment.method}</p>
                <p className="text-xs text-muted-foreground">{payment.attempts} attempt(s) so far</p>
              </Field>
              <Field icon={<AlertOctagon className="size-4" />} label="Failure reason">
                <p className="font-medium">{payment.reason}</p>
                <p className="text-xs text-muted-foreground">
                  Declined {new Date(payment.failedAt).toLocaleString("en-IN")}
                </p>
              </Field>
              <Field icon={<Sparkles className="size-4" />} label="Recovery probability">
                <p className="font-medium">{payment.probability}%</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="brand-gradient-bg h-full rounded-full transition-all"
                    style={{ width: `${payment.probability}%` }}
                  />
                </div>
              </Field>
            </div>
          </section>

          <section className="panel p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <h3 className="text-base font-semibold">AI Recommendation</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {payment.recommendation}
            </p>
            <div className="mt-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-xs">
              Recommended next action:{" "}
              <span className="font-semibold text-accent">
                {ACTION_LABEL[payment.recommendedAction]}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={() => run(payment.recommendedAction)}
                disabled={payment.status === "recovered"}
              >
                <Zap className="size-4" /> Execute Recovery Action
              </Button>
              <Button
                variant="outline"
                onClick={() => run("retry")}
                disabled={payment.status === "recovered"}
              >
                <Zap className="size-4" /> Retry Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => run("payment_link")}
                disabled={payment.status === "recovered"}
              >
                <Link2 className="size-4" /> Send Payment Link
              </Button>
              <Button
                variant="outline"
                onClick={() => run("reminder")}
                disabled={payment.status === "recovered"}
              >
                <BellRing className="size-4" /> Schedule Reminder
              </Button>
            </div>
            {payment.status === "recovered" && (
              <p className="mt-3 text-xs font-medium text-success">
                This payment has been recovered — no further action required.
              </p>
            )}
          </section>
        </div>

        <section className="panel h-fit p-6">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h3 className="text-base font-semibold">Recovery timeline</h3>
          </div>
          <ol className="mt-4 space-y-4">
            {payment.activity.map((a) => (
              <li key={a.id} className="relative pl-5">
                <span className="absolute left-0 top-1.5 size-2 rounded-full bg-primary" />
                <p className="text-xs leading-relaxed">{a.label}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {new Date(a.at).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/50 p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}
