import { KitchenOrder } from "@/types/kitchenOrder"

import { OrderStatus, type IRefundedLineItem } from "@/model/order"

import { resolveOrderDisplayNumber } from "@/utils/orderNumberDisplay"



type OrderDoc = {

  _id: unknown

  merchantId?: unknown

  restaurantId?: unknown

  orderNo?: string

  tableName: string

  items: KitchenOrder["items"]

  total: number

  status: string

  paymentMethod?: string

  paidAmount?: number

  vatType?: string

  guestCount?: number

  discountAmount?: number

  changeAmount?: number

  paidAt?: Date | string

  refundStatus?: string

  refundedAmount?: number

  refundedItems?: IRefundedLineItem[]

  createdAt: Date | string

  updatedAt?: Date | string

}



function refundedQtyByLine(

  refundedItems?: IRefundedLineItem[]

): Map<number, number> {

  const map = new Map<number, number>()

  for (const row of refundedItems ?? []) {

    map.set(row.lineIndex, (map.get(row.lineIndex) ?? 0) + row.quantityRefunded)

  }

  return map

}



export function serializeKitchenOrder(doc: OrderDoc): KitchenOrder {

  const refundedByLine = refundedQtyByLine(doc.refundedItems)



  return {

    _id: String(doc._id),

    merchantId: doc.merchantId ? String(doc.merchantId) : undefined,

    restaurantId: doc.restaurantId ? String(doc.restaurantId) : undefined,

    orderNo: doc.orderNo?.trim() || undefined,

    tableName: doc.tableName,

    items: doc.items.map((item, index) => ({

      ...item,

      menuItemId: item.menuItemId ? String(item.menuItemId) : undefined,

      refundedQuantity: refundedByLine.get(index) ?? 0,

    })),

    total: doc.total,

    status: doc.status as OrderStatus,

    paymentMethod: doc.paymentMethod,

    paidAmount: doc.paidAmount ?? doc.total,

    vatType: doc.vatType,

    guestCount: doc.guestCount,

    discountAmount: doc.discountAmount ?? 0,

    changeAmount: doc.changeAmount ?? 0,

    paidAt: doc.paidAt

      ? typeof doc.paidAt === "string"

        ? doc.paidAt

        : doc.paidAt.toISOString()

      : undefined,

    refundStatus: (doc.refundStatus as KitchenOrder["refundStatus"]) ?? "none",

    refundedAmount: doc.refundedAmount ?? 0,

    refundedItems: (doc.refundedItems ?? []).map((row) => ({

      lineIndex: row.lineIndex,

      menuItemId: row.menuItemId ? String(row.menuItemId) : undefined,

      title: row.title,

      quantityRefunded: row.quantityRefunded,

      amountRefunded: row.amountRefunded,

    })),

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



type OrderNumberInput =

  | string

  | {

      _id: string

      orderNo?: string | null

    }



/** Захиалгын дугаар харуулах — шинэ orderNo эсвэл хуучин _id suffix */

export function formatOrderNumber(orderOrId: OrderNumberInput): string {

  if (typeof orderOrId === "string") {

    const trimmed = orderOrId.trim()

    if (/^\d{12}$/.test(trimmed)) return trimmed

    return trimmed.slice(-8).toUpperCase()

  }

  return resolveOrderDisplayNumber(orderOrId)

}


