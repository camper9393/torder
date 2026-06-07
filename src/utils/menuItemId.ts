/** Normalize MongoDB _id from API/lean documents to a 24-char hex string. */
export function toMenuItemId(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "object") {
    if ("$oid" in value && typeof (value as { $oid: string }).$oid === "string") {
      return (value as { $oid: string }).$oid
    }
    if ("toString" in value && typeof value.toString === "function") {
      return value.toString()
    }
  }
  return String(value)
}

export function isValidMenuItemId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id)
}
