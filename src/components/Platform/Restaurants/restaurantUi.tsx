"use client";

import type { Restaurant, SubscriptionStatus } from "@/types/restaurant";
import { cn } from "@/lib/utils";
import { Store } from "lucide-react";

export function RestaurantAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const letter = (name.trim().charAt(0) || "R").toUpperCase();
  const sizeClass =
    size === "sm"
      ? "h-10 w-10 text-sm"
      : size === "lg"
        ? "h-16 w-16 text-2xl"
        : "h-12 w-12 text-lg";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 font-semibold text-white shadow-sm",
        sizeClass,
        className
      )}
      aria-hidden
    >
      {letter}
    </div>
  );
}

type BadgeRestaurant = Pick<
  Restaurant,
  "isActive" | "subscriptionStatus" | "expireDate"
> & {
  hasPendingPayment?: boolean;
  daysRemaining?: number;
};

export function RestaurantStatusBadges({
  restaurant,
}: {
  restaurant: BadgeRestaurant;
}) {
  const badges: { label: string; className: string }[] = [];

  if (!restaurant.isActive) {
    badges.push({
      label: "Идэвхгүй",
      className: "bg-slate-100 text-slate-600",
    });
  } else if (restaurant.subscriptionStatus === "expired") {
    badges.push({
      label: "Хугацаа дууссан",
      className: "bg-red-50 text-red-700",
    });
  } else {
    badges.push({
      label: "Идэвхтэй",
      className: "bg-green-50 text-green-700",
    });
  }

  if (restaurant.hasPendingPayment) {
    badges.push({
      label: "Төлбөр хүлээгдэж буй",
      className: "bg-amber-50 text-amber-800",
    });
  }

  if (
    restaurant.daysRemaining !== undefined &&
    restaurant.daysRemaining <= 14 &&
    restaurant.daysRemaining > 0 &&
    restaurant.subscriptionStatus !== "expired"
  ) {
    badges.push({
      label: `${restaurant.daysRemaining} хоног үлдсэн`,
      className: "bg-orange-50 text-orange-700",
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b.label}
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
            b.className
          )}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-700">
      {plan}
    </span>
  );
}

export function formatMnDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatMnDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("mn-MN");
  } catch {
    return "—";
  }
}

export function subscriptionLabel(status: SubscriptionStatus | string): string {
  const map: Record<string, string> = {
    active: "Идэвхтэй",
    expired: "Хугацаа дууссан",
    suspended: "Түдгэлзсэн",
    paid: "Төлсөн",
    pending: "Хүлээгдэж буй",
    overdue: "Хугацаа хэтэрсэн",
  };
  return map[status] ?? status;
}

export function InfoCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  );
}

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-50 py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function EmptySection({ message = "Мэдээлэл байхгүй байна" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 text-center">
      <Store className="mb-2 h-8 w-8 text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
