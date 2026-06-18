/** Рестораны локал цаг — одоогоор Монголын timezone */
export const DEFAULT_ORDER_TIMEZONE = "Asia/Ulaanbaatar";

export function formatOrderMinutePrefix(
  date: Date,
  timeZone: string = DEFAULT_ORDER_TIMEZONE
): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}`;
}

export function resolveOrderDisplayNumber(order: {
  _id: string;
  orderNo?: string | null;
}): string {
  const stored = order.orderNo?.trim();
  if (stored) return stored;
  return String(order._id).slice(-8).toUpperCase();
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}
