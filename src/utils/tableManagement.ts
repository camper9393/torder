import { OrderStatus } from "@/model/order"
import { UNKNOWN_TABLE } from "@/utils/table"

/** Orders that occupy a table until it is closed */
export const ACTIVE_TABLE_ORDER_STATUSES: OrderStatus[] = [
  "new",
  "accepted",
  "cooking",
  "done",
]

export type TableDisplayStatus =
  | "free"
  | "new"
  | "accepted"
  | "cooking"
  | "waiting_bill"

const STATUS_PRIORITY = [
  "new",
  "accepted",
  "cooking",
  "done",
] as const satisfies readonly OrderStatus[]

export function deriveTableDisplayStatus(
  activeStatuses: OrderStatus[]
): TableDisplayStatus {
  if (activeStatuses.length === 0) return "free"

  for (const status of STATUS_PRIORITY) {
    if (activeStatuses.includes(status)) {
      if (status === "done") return "waiting_bill"
      return status
    }
  }

  return "free"
}

/**
 * QR Manager tables first (creation order). Optional order-only names append at the end
 * (used only when no merchant scope — e.g. legacy /tables without login).
 * Names match exactly (MQR.name === Order.tableName).
 */
export function mergeTableNameList(
  qrTableNamesInOrder: string[],
  orderTableNames: Iterable<string>
): string[] {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const name of qrTableNamesInOrder) {
    const trimmed = name?.trim()
    if (!trimmed || trimmed === UNKNOWN_TABLE || seen.has(trimmed)) continue
    seen.add(trimmed)
    merged.push(trimmed)
  }

  const extras: string[] = []
  for (const name of orderTableNames) {
    const trimmed = name?.trim()
    if (!trimmed || trimmed === UNKNOWN_TABLE || seen.has(trimmed)) continue
    seen.add(trimmed)
    extras.push(trimmed)
  }

  extras.sort((a, b) => a.localeCompare(b, "mn", { numeric: true }))
  return [...merged, ...extras]
}
