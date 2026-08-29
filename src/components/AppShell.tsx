import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  AlertTriangle,
  Bot,
  BarChart3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { usePayments, computeMetrics } from "@/lib/recovery-store";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/failed-payments", label: "Failed Payments", icon: AlertTriangle },
  { to: "/recovery-queue", label: "AI Recovery Queue", icon: Bot },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const metrics = computeMetrics(usePayments());

  return (
    <div className="min-h-screen grid-glow bg-background">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col lg:flex-row">
        <aside className="border-b border-sidebar-border bg-sidebar lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-5 py-6">
            <div className="brand-gradient-bg flex size-10 items-center justify-center rounded-xl">
              <ShieldCheck className="size-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-none text-sidebar-foreground">
                PayRecover <span className="brand-gradient-text">AI</span>
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                Track 3 · Revenue Agent
              </p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className: "bg-sidebar-accent text-sidebar-accent-foreground shadow-[var(--glow-primary)]",
                }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden px-5 lg:block">
            <div className="panel p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                <Sparkles className="size-3.5" /> Agent status
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Autonomous recovery agent online. {metrics.failedCount} open failures,{" "}
                {metrics.inRecovery} in active recovery.
              </p>
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
              Demo environment. All customers, cards and transactions shown are synthetic.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-7 lg:px-9">
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground lg:text-3xl">{title}</h1>
              {subtitle && (
                <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Synthetic demo data
            </span>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
