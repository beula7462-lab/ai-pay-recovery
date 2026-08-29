import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/recovery-ui";
import { HISTORY, formatCompactINR, formatINR } from "@/lib/demo-data";
import { usePayments, computeMetrics } from "@/lib/recovery-store";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — PayRecover AI Recovery Performance" },
      {
        name: "description",
        content:
          "Recovery analytics: revenue at risk versus recovered by month, failure-reason mix, payment-method performance and recovery rate trend in ₹.",
      },
      { property: "og:title", content: "Analytics — PayRecover AI" },
      {
        property: "og:description",
        content: "Recovery performance analytics across failure reasons, methods and months.",
      },
    ],
  }),
  component: Analytics,
});

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function Analytics() {
  const payments = usePayments();
  const m = computeMetrics(payments);

  const currentMonth = { month: "Now", atRisk: m.atRisk, recovered: m.recovered };
  const trend = [...HISTORY, currentMonth];
  const rateTrend = trend.map((t) => ({
    month: t.month,
    rate: Number(((t.recovered / (t.recovered + t.atRisk)) * 100).toFixed(1)),
  }));

  const byReason = Object.entries(
    payments.reduce<Record<string, number>>((acc, p) => {
      acc[p.reason] = (acc[p.reason] ?? 0) + p.amount;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const byMethod = Object.entries(
    payments.reduce<Record<string, { total: number; recovered: number }>>((acc, p) => {
      const e = (acc[p.method] ??= { total: 0, recovered: 0 });
      e.total += p.amount;
      if (p.status === "recovered") e.recovered += p.amount;
      return acc;
    }, {}),
  ).map(([method, v]) => ({
    method,
    total: v.total,
    recovered: v.recovered,
    rate: v.total ? Math.round((v.recovered / v.total) * 100) : 0,
  }));

  const tooltipStyle = {
    backgroundColor: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    fontSize: 12,
    color: "var(--color-popover-foreground)",
  };

  return (
    <AppShell
      title="Recovery Analytics"
      subtitle="Performance of the AI recovery agent across months, failure reasons and payment methods. All figures in Indian Rupees."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Recovered (live)" value={formatINR(m.recovered)} tone="success" />
        <StatCard label="Still at risk" value={formatINR(m.atRisk)} tone="danger" />
        <StatCard
          label="Recovery rate"
          value={`${m.recoveryRate.toFixed(1)}%`}
          tone={m.recoveryRate >= 40 ? "success" : "warning"}
        />
        <StatCard
          label="Avg ticket size"
          value={formatINR(
            Math.round(payments.reduce((s, p) => s + p.amount, 0) / (payments.length || 1)),
          )}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-base font-semibold">At risk vs recovered</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickFormatter={(v) => formatCompactINR(Number(v))}
                  width={70}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number | string) => formatINR(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="atRisk" name="At risk" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="recovered"
                  name="Recovered"
                  fill="var(--color-chart-2)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-base font-semibold">Recovery rate trend</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rateTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  unit="%"
                  domain={[0, 100]}
                  width={45}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string) => `${v}%`} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Recovery rate"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-base font-semibold">Failure reason mix</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byReason}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {byReason.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number | string) => formatINR(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-base font-semibold">Payment method performance</h2>
          <div className="mt-4 space-y-4">
            {byMethod.map((mth) => (
              <div key={mth.method}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{mth.method}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatCompactINR(mth.recovered)} / {formatCompactINR(mth.total)} · {mth.rate}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${mth.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
