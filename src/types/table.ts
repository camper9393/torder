import { KitchenOrder } from "@/types/kitchenOrder"
import { TableDisplayStatus } from "@/utils/tableManagement"
import type { FloorLayoutTable } from "@/types/floorLayout"

export type TablePreviewItem = {
  title: string
  quantity: number
  served?: boolean
  orderId: string
  itemIndex: number
}

export type TableSummary = {
  tableName: string
  layout?: FloorLayoutTable
  status: TableDisplayStatus
  activeOrderCount: number
  itemCount: number
  totalAmount: number
  latestOrderTime: string | null
  /** @deprecated Use pendingPreviewItems — kept for API compatibility */
  previewItems: TablePreviewItem[]
  morePreviewCount: number
  pendingPreviewItems: TablePreviewItem[]
  servedPreviewItems: TablePreviewItem[]
  morePendingCount: number
  moreServedCount: number
  /** Sum of quantities for items not yet marked served */
  pendingQuantityCount: number
  newOrderIds: string[]
  /** Table-level waiter call flag (when supported). */
  waiterCalled?: boolean
  /** Active waiter call document id (for dismiss). */
  waiterCallId?: string
  /** Any active order has status waiter_called. */
  hasWaiterCalledOrder?: boolean
  /** Any active order is paid / payment completed. */
  isPaid?: boolean
}

export type TableDetail = {
  tableName: string
  status: TableDisplayStatus
  activeOrderCount: number
  itemCount: number
  totalAmount: number
  latestOrderTime: string | null
  orders: KitchenOrder[]
}
