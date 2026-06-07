import type { CheckOutItems } from "@/store/reducer/checkout"
import { normalizeTableName } from "@/utils/table"
import { getSessionOrderNumber } from "@/utils/tabletSession"

export type TabletOrderHistoryBatch = {
  id: string
  orderNo: number
  submittedAt: string
  items: CheckOutItems[]
}

export const TABLET_ORDER_HISTORY_EVENT = "tablet-order-history-update"

function storageKey(merchantId: string, tableName: string): string {
  return `tablet-order-history-${merchantId}-${normalizeTableName(tableName)}`
}

function readRaw(merchantId: string, tableName: string): TabletOrderHistoryBatch[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(storageKey(merchantId, tableName))
    if (!raw) return []
    const parsed = JSON.parse(raw) as TabletOrderHistoryBatch[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRaw(
  merchantId: string,
  tableName: string,
  batches: TabletOrderHistoryBatch[]
): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(storageKey(merchantId, tableName), JSON.stringify(batches))
  const normalizedTable = normalizeTableName(tableName)
  window.dispatchEvent(
    new CustomEvent(TABLET_ORDER_HISTORY_EVENT, {
      detail: { merchantId, tableName: normalizedTable },
    })
  )
}

export function getTabletOrderHistory(
  merchantId: string,
  tableName: string
): TabletOrderHistoryBatch[] {
  return readRaw(merchantId, tableName)
}

export function appendTabletOrderHistory(
  merchantId: string,
  tableName: string,
  items: CheckOutItems[]
): void {
  if (typeof window === "undefined" || items.length === 0) return

  const orderNo = getSessionOrderNumber(merchantId)
  const batch: TabletOrderHistoryBatch = {
    id: `${Date.now()}-${orderNo}`,
    orderNo,
    submittedAt: new Date().toISOString(),
    items: items.map((item) => ({ ...item })),
  }

  const existing = readRaw(merchantId, tableName)
  writeRaw(merchantId, tableName, [...existing, batch])
}
