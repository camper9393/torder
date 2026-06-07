import { KitchenOrder } from "@/types/kitchenOrder"
import { OrderStatus } from "@/model/order"

export function serializeKitchenOrder(doc: {
  _id: unknown
  merchantId?: unknown
  tableName: string
  items: KitchenOrder["items"]
  total: number
  status: string
  createdAt: Date | string
  updatedAt?: Date | string
}): KitchenOrder {
  return {
    _id: String(doc._id),
    merchantId: doc.merchantId ? String(doc.merchantId) : undefined,
    tableName: doc.tableName,
    items: doc.items,
    total: doc.total,
    status: doc.status as OrderStatus,
    createdAt:
      typeof doc.createdAt === "string"
        ? doc.createdAt
        : doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt
      ? typeof doc.updatedAt === "string"
        ? doc.updatedAt
        : doc.updatedAt.toISOString()
      : undefined,
  }
}
