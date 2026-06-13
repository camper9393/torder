"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2, type LucideIcon } from "lucide-react";
import React from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Тийм",
  cancelLabel = "Болих",
  tone = "danger",
  confirmText,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  /** Хэрэв өгвөл хэрэглэгч энэ текстийг яг бичих ёстой (жишээ нь рестораны нэр) */
  confirmText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = React.useState("");

  React.useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  if (!open) return null;

  const canConfirm = confirmText ? typed.trim() === confirmText.trim() : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          {tone === "danger" ? (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description ? (
              <div className="mt-1 text-sm text-slate-600">{description}</div>
            ) : null}
          </div>
        </div>

        {confirmText ? (
          <div className="mt-4 space-y-1.5">
            <label className="text-sm text-slate-600">
              Баталгаажуулахын тулд{" "}
              <span className="font-semibold text-slate-900">{confirmText}</span>{" "}
              гэж бичнэ үү
            </label>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} />
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            className={
              tone === "danger" ? "bg-red-600 hover:bg-red-700" : undefined
            }
          >
            {loading ? "Түр хүлээнэ үү..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PlatformLoading({ label = "Ачааллаж байна..." }: { label?: string }) {
  return (
    <div className="flex min-h-[30vh] items-center justify-center text-slate-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
      {label}
    </div>
  );
}

export function PlatformEmpty({ message = "Мэдээлэл байхгүй байна" }: { message?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function PlatformError({ message = "Алдаа гарлаа" }: { message?: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  );
}

export function PlatformPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PlatformCard({
  children,
  className = "",
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm",
        className
      )}
    >
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function PlatformStatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  tone?: "blue" | "green" | "amber" | "slate" | "red";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {sub ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
        </div>
        {Icon ? (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PlatformTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="border-b border-slate-200 bg-white px-1">
      <nav className="-mb-px flex flex-wrap gap-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "border-b-2 px-4 py-3 text-sm font-medium transition",
              active === t.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-800"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function PlatformStatusPill({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "default";
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
    danger: "bg-red-50 text-red-700 ring-red-600/20",
    info: "bg-blue-50 text-blue-700 ring-blue-600/20",
    default: "bg-slate-100 text-slate-600 ring-slate-500/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[variant]
      )}
    >
      {label}
    </span>
  );
}

export function PlatformBarChart({
  data,
  valueKey,
  labelKey,
  formatValue,
}: {
  data: Record<string, unknown>[];
  valueKey: string;
  labelKey: string;
  formatValue?: (v: number) => string;
}) {
  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-44 items-end gap-2 pt-2">
      {data.map((row, i) => {
        const val = Number(row[valueKey]) || 0;
        const pct = Math.max((val / max) * 100, 4);
        const label = String(row[labelKey]);
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-[10px] font-medium text-slate-500">
              {formatValue ? formatValue(val) : val}
            </span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="truncate text-[10px] text-slate-400">{label.slice(-2) || label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function PlatformDonutChart({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const gradient = segments
    .map((s) => {
      const start = acc;
      acc += (s.value / total) * 100;
      return `${s.color} ${start}% ${acc}%`;
    })
    .join(", ");

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-28 w-28 shrink-0">
        <div
          className="h-full w-full rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        <div className="absolute inset-3 flex items-center justify-center rounded-full bg-white text-center">
          <span className="text-lg font-bold text-slate-900">{total}</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="font-semibold text-slate-900">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlatformQuickAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </span>
      <span className="leading-tight">{label}</span>
    </button>
  );
}

export function PlatformTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-slate-100", className)}>
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function PlatformTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
      {children}
    </thead>
  );
}
