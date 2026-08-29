import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/demo-data";
import type { ReactNode } from "react";

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; className: string }> = {
    failed: { label: "Failed", className: "border-destructive/40 bg-destructive/15 text-destructive" },
    in_recovery: { label: "In Recovery", className: "border-warning/40 bg-warning/15 text-warning" },
    recovered: { label: "Recovered", className: "border-success/40 bg-success/15 text-success" },
    lost: { label: "Written Off", className: "border-border bg-muted text-muted-foreground" },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        s.className,
      )}
    >
      {s.label}
    </span>
  );
}

export function ProbabilityBar({ value }: { value: number }) {
  const tone = value >= 70 ? "bg-success" : value >= 45 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-xs text-muted-foreground">{value}%</span>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  tone?: "default" | "danger" | "success" | "warning";
}) {
  const toneClass = {
    default: "text-foreground",
    danger: "text-destructive",
    success: "text-success",
    warning: "text-warning",
  }[tone];

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className={cn("mt-3 font-display text-2xl font-semibold lg:text-[28px]", toneClass)}>{value}</p>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
