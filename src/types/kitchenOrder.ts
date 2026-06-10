import { OrderStatus, RefundStatus } from "@/model/order"
import type { RefundedLineItem } from "@/types/refund"

export type KitchenOrder = {
  _id: string
  merchantId?: string
  tableName: string
  items: {
    menuItemId?: string
    title: string
    nameMn?: string
    nameEn?: string
    selectedSizeLabelMn?: string
    selectedSizeLabelEn?: string
    price: number
    quantity: number
    image?: string
    served?: boolean
    refundedQuantity?: number
  }[]
  total: number
  status: OrderStatus
  paymentMethod?: string
  paidAmount?: number
  refundStatus?: RefundStatus
  refundedAmount?: number
  refundedItems?: RefundedLineItem[]
  createdAt: string
  updatedAt?: string
}
