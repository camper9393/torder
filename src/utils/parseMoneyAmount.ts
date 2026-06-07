/** Parse API/UI values into a finite unit price (rejects objects, formatted strings). */
export function parseMoneyAmount(value: unknown): number {
  if (value == null) return NaN
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    if ("price" in obj) return parseMoneyAmount(obj.price)
    if ("selectedPrice" in obj) return parseMoneyAmount(obj.selectedPrice)
    return NaN
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[₮\s\u00a0]/g, "").replace(/,/g, "").trim()
    if (!cleaned) return NaN
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}
