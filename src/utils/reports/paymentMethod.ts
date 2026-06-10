export type PaymentMethodGroup =
  | "cash"
  | "card"
  | "qpay"
  | "socialpay"
  | "bank_transfer"
  | "other";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodGroup, string> = {
  cash: "Бэлэн",
  card: "Карт",
  qpay: "QPay",
  socialpay: "SocialPay",
  bank_transfer: "Банк шилжүүлэг",
  other: "Бусад",
};

export const PAYMENT_METHOD_GROUPS: PaymentMethodGroup[] = [
  "cash",
  "card",
  "qpay",
  "socialpay",
  "bank_transfer",
  "other",
];

export function normalizePaymentMethod(
  raw?: string | null
): PaymentMethodGroup {
  const value = (raw || "Бэлэн").toLowerCase().trim();
  if (/бэлэн|cash|бэлтэн/.test(value)) return "cash";
  if (/карт|card|visa|master|debit/.test(value)) return "card";
  if (/qpay|q pay|q-пэй|купэй/.test(value)) return "qpay";
  if (/social|сошиал|socialpay/.test(value)) return "socialpay";
  if (/банк|bank|transfer|шилжүүлэг/.test(value)) return "bank_transfer";
  if (!value || value === "бусад" || value === "other") return "other";
  return "other";
}
