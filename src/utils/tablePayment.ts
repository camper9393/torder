export type TablePaymentMethod = string;

export type TableVatType = "Иргэн" | "Байгууллага" | "НӨАТ-гүй";

/** @deprecated Use enabled options from Settings via useTablePaymentMethods */
export const TABLE_PAYMENT_METHODS: TablePaymentMethod[] = [
  "Данс",
  "Бэлэн",
  "Карт",
  "QPay",
];

export const TABLE_VAT_TYPES: TableVatType[] = [
  "Иргэн",
  "Байгууллага",
  "НӨАТ-гүй",
];

export const DISCOUNT_PRESETS = [5, 10, 20] as const;

export type TablePaymentReceiptData = {
  subtotal: number;
  discountAmount: number;
  amountDue: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: TablePaymentMethod;
  vatType: TableVatType;
  guestCount: number;
  vatAmount: number;
  paidAt: string;
};

/** Display-only VAT estimate (10% included in amount due). */
export function estimateVatAmount(
  amountDue: number,
  vatType: TableVatType
): number {
  if (vatType === "НӨАТ-гүй" || amountDue <= 0) return 0;
  return Math.round((amountDue * 10) / 110);
}

export function parsePaidKeypadInput(raw: string): number {
  const cleaned = raw.replace(/\D/g, "");
  if (!cleaned) return 0;
  return Number(cleaned);
}

export function appendKeypadDigit(current: string, digit: string): string {
  if (digit === "00") {
    if (!current || current === "0") return current;
    return `${current}00`;
  }
  if (digit === "0" && current === "0") return current;
  if (!current || current === "0") return digit === "0" ? "0" : digit;
  return `${current}${digit}`;
}

export function backspaceKeypadInput(current: string): string {
  if (!current) return "";
  const next = current.slice(0, -1);
  return next || "0";
}
