const LAYOUT_PREFIX = "admin-tables-layout"

export function layoutStorageKey(merchantId: string): string {
  return `${LAYOUT_PREFIX}-${merchantId}`
}

export function loadTableLayoutOrder(merchantId: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(layoutStorageKey(merchantId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : []
  } catch {
    return []
  }
}

export function saveTableLayoutOrder(
  merchantId: string,
  tableNames: string[]
): void {
  if (typeof window === "undefined") return
  localStorage.setItem(layoutStorageKey(merchantId), JSON.stringify(tableNames))
}

export function clearTableLayoutOrder(merchantId: string): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(layoutStorageKey(merchantId))
}

export function sortTablesByLayout<T extends { tableName: string }>(
  tables: T[],
  layoutOrder: string[]
): T[] {
  if (layoutOrder.length === 0) return tables

  const byName = new Map(tables.map((t) => [t.tableName, t]))
  const sorted: T[] = []

  for (const name of layoutOrder) {
    const row = byName.get(name)
    if (row) {
      sorted.push(row)
      byName.delete(name)
    }
  }

  for (const row of byName.values()) {
    sorted.push(row)
  }

  return sorted
}
