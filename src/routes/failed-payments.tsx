import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, ProbabilityBar } from "@/components/recovery-ui";
import { formatINR } from "@/lib/demo-data";
import { usePayments } from "@/lib/recovery-store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "failed", "in_recovery", "recovered"] as const;
const FILTER_LABEL: Record<(typeof FILTERS)[number], string> = {
  all: "All",
  failed: "Failed",
  in_recovery: "In Recovery",
  recovered: "Recovered",
};

export const Route = createFileRoute("/failed-payments")({
  head: () => ({
    meta: [
      { title: "Failed Payments — PayRecover AI" },
      {
        name: "description",
        content:
          "Browse every failed payment with amount in ₹, payment method, failure reason and AI recovery score. Select a record for deep transaction analysis.",
      },
      { property: "og:title", content: "Failed Payments — PayRecover AI" },
      {
        property: "og:description",
        content: "Every failed transaction, scored and ready for AI-driven recovery.",
      },
    ],
  }),
  component: FailedPayments,
});

function FailedPayments() {
  const payments = usePayments();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const rows = payments.filter((p) => {
    const matchesFilter = filter === "all" || p.status === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q === "" ||
      p.customer.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.reason.toLowerCase().includes(q) ||
      p.method.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <AppShell
      title="Failed Payments"
      subtitle="Synthetic ledger of declined transactions. Select any row to open the full AI transaction analysis."
    >
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {FILTER_LABEL[f]}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer, ID, method or reason"
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Transaction</th>
                <th className="pb-3 pr-4 font-medium">Customer</th>
                <th className="pb-3 pr-4 font-medium">Amount</th>
                <th className="pb-3 pr-4 font-medium">Method</th>
                <th className="pb-3 pr-4 font-medium">Failure reason</th>
                <th className="pb-3 pr-4 font-medium">Recovery score</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate({ to: "/transaction/$id", params: { id: p.id } })}
                  className="cursor-pointer border-b border-border/60 transition-colors hover:bg-surface-2/70"
                >
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{p.id}</td>
                  <td className="py-3 pr-4">
                    <p className="font-medium">{p.customer}</p>
                    <p className="text-[11px] text-muted-foreground">{p.plan}</p>
                  </td>
                  <td className="py-3 pr-4 font-mono">{formatINR(p.amount)}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.method}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.reason}</td>
                  <td className="py-3 pr-4">
                    <ProbabilityBar value={p.probability} />
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3 text-right">
                    <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payments match this filter.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
