import type { OrderStatus } from "@/model/order";
import type { OrderHistoryRow } from "@/types/reports";

export type PaymentBadgeTone =
  | "cash"
  | "card"
  | "qpay"
  | "bank"
  | "khan"
  | "golomt"
  | "default";

const PAYMENT_BADGE_CLASS: Record<PaymentBadgeTone, string> = {
  cash: "border-emerald-200 bg-emerald-50 text-emerald-800",
  card: "border-blue-200 bg-blue-50 text-blue-800",
  qpay: "border-violet-200 bg-violet-50 text-violet-800",
  bank: "border-orange-200 bg-orange-50 text-orange-800",
  khan: "border-cyan-200 bg-cyan-50 text-cyan-900",
  golomt: "border-indigo-300 bg-indigo-950 text-indigo-50",
  default: "border-gray-200 bg-gray-50 text-gray-700",
};

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  new: "border-sky-200 bg-sky-50 text-sky-800",
  accepted: "border-indigo-200 bg-indigo-50 text-indigo-800",
  cooking: "border-amber-200 bg-amber-50 text-amber-900",
  done: "border-teal-200 bg-teal-50 text-teal-800",
  closed: "border-slate-300 bg-slate-100 text-slate-800",
};

const STATUS_LABEL_MN: Record<OrderStatus, string> = {
  new: "Шинэ",
  accepted: "Хүлээн авсан",
  cooking: "Хийгдэж байна",
  done: "Бэлэн болсон",
  closed: "Хаагдсан",
};

export function normalizePaymentKey(value?: string): PaymentBadgeTone {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return "default";
  if (raw.includes("бэлэн") || raw.includes("cash")) return "cash";
  if (raw.includes("карт") || raw.includes("card")) return "card";
  if (raw.includes("qpay") || raw.includes("qr")) return "qpay";
  if (raw.includes("данс") || raw.includes("bank")) return "bank";
  if (raw.includes("khan")) return "khan";
  if (raw.includes("golomt") || raw.includes("гolomt")) return "golomt";
  return "default";
}

export function resolvePaymentBadge(paymentMethod?: string) {
  const tone = normalizePaymentKey(paymentMethod);
  return {
    tone,
    label: paymentMethod?.trim() || "—",
    className: PAYMENT_BADGE_CLASS[tone],
  };
}

export function resolveOrderStatusBadge(
  status: OrderStatus,
  refundStatus?: string
) {
  if (refundStatus === "full" || refundStatus === "partial") {
    return {
      label: "Буцаагдсан",
      className: "border-red-200 bg-red-50 text-red-800",
    };
  }
  return {
    label: STATUS_LABEL_MN[status] ?? status,
    className: STATUS_BADGE_CLASS[status] ?? PAYMENT_BADGE_CLASS.default,
  };
}

export function resolveVatTypeLabel(vatType?: string) {
  const v = vatType?.trim();
  if (!v) return "—";
  if (v === "Байгууллага") return "Байгууллага";
  if (v === "Иргэн") return "Иргэн";
  return v;
}

export function formatReportDateTime(iso?: string) {
  if (!iso) return { date: "—", time: "—", full: "—" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "—", full: "—" };
  return {
    date: d.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    time: d.toLocaleTimeString("mn-MN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    full: d.toLocaleString("mn-MN", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  };
}

export function computeTodaySummary(orders: OrderHistoryRow[]) {
  const count = orders.length;
  const revenue = orders.reduce((sum, row) => sum + row.netTotal, 0);
  const refundCount = orders.filter(
    (row) => row.refundStatus === "partial" || row.refundStatus === "full"
  ).length;
  const averageOrderValue = count > 0 ? Math.round(revenue / count) : 0;
  return { count, revenue, refundCount, averageOrderValue };
}

export const PAYMENT_FILTER_OPTIONS = [
  { value: "all", label: "Бүх төлбөр" },
  { value: "cash", label: "Бэлэн" },
  { value: "card", label: "Карт" },
  { value: "qpay", label: "QPay" },
  { value: "bank", label: "Данс" },
  { value: "khan", label: "Khan POS" },
  { value: "golomt", label: "Golomt POS" },
] as const;

export function matchesPaymentFilter(
  paymentMethod: string | undefined,
  filter: string
) {
  if (filter === "all") return true;
  return normalizePaymentKey(paymentMethod) === filter;
}
