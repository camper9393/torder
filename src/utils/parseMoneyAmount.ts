const NESTED_PRICE_KEYS = [
  "price",
  "selectedPrice",
  "finalPrice",
  "unitPrice",
  "salePrice",
  "amount",
  "value",
  "base",
] as const

/** Parse API/UI values into a finite unit price (objects, strings, nested fields). */
export function parseMoneyAmount(value: unknown, depth = 0): number {
  if (value == null) return NaN
  if (depth > 5) return NaN

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[₮\s\u00a0]/g, "").replace(/,/g, "").trim()
    if (!cleaned) return NaN
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : NaN
  }

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const parsed = parseMoneyAmount(entry, depth + 1)
        if (Number.isFinite(parsed) && parsed > 0) return parsed
      }
      return NaN
    }

    const obj = value as Record<string, unknown>

    if (Array.isArray(obj.portionPrices)) {
      for (const entry of obj.portionPrices) {
        const parsed = parseMoneyAmount(entry, depth + 1)
        if (Number.isFinite(parsed) && parsed > 0) return parsed
      }
    }

    for (const key of NESTED_PRICE_KEYS) {
      if (!(key in obj)) continue
      const parsed = parseMoneyAmount(obj[key], depth + 1)
      if (Number.isFinite(parsed)) return parsed
    }

    return NaN
  }

  return NaN
}

/** True when value is a positive finite unit price. */
export function isPositiveMoneyAmount(value: unknown): boolean {
  const parsed = parseMoneyAmount(value)
  return Number.isFinite(parsed) && parsed > 0
}
