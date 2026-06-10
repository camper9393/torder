import { KitchenOrder } from "@/types/kitchenOrder"

import { resolveOrderLinePrice, resolveOrderLineQuantity } from "@/utils/orderLineMapping"



export type BillableLineItem = {

  price?: unknown

  unitPrice?: unknown

  selectedPrice?: unknown

  quantity?: number

  itemCount?: number

  qty?: number

  count?: number

  orderQuantity?: number

  title?: string

  menuItem?: { price?: unknown }

  selectedSize?: unknown

}



export function resolveLineItemUnitPrice(item: BillableLineItem): number {

  const n = resolveOrderLinePrice(item)

  return Number.isFinite(n) && n >= 0 ? n : 0

}



export function resolveLineItemQuantity(item: BillableLineItem): number {

  return resolveOrderLineQuantity(item)

}



export function computeLineItemSubtotal(item: BillableLineItem): number {

  return resolveLineItemUnitPrice(item) * resolveLineItemQuantity(item)

}



/** Sum of all line items (includes served and unserved). */

export function computeOrderTotal(items: BillableLineItem[]): number {

  return items.reduce((sum, item) => sum + computeLineItemSubtotal(item), 0)

}



/** Sum across multiple orders on one table. */

export function computeOrdersTotal(

  orders: { items: BillableLineItem[] }[]

): number {

  return orders.reduce((sum, order) => sum + computeOrderTotal(order.items), 0)

}



/** Match table card when line prices are missing from a partial API projection. */

export function computeOrdersTotalWithStoredFallback(

  orders: { items: BillableLineItem[]; total?: number }[]

): number {

  const fromLines = computeOrdersTotal(orders)

  if (fromLines > 0) return fromLines

  return orders.reduce((sum, order) => {

    const stored = Number(order.total)

    return sum + (Number.isFinite(stored) && stored > 0 ? stored : 0)

  }, 0)

}



export function flattenOrdersToLineItems<T extends BillableLineItem>(

  orders: { items: T[] }[]

): T[] {

  return orders.flatMap((order) => order.items)

}



/** Single receipt payload for a table with one or more active orders. */

export function buildCombinedTableBill(

  orders: KitchenOrder[],

  tableName: string

): KitchenOrder | null {

  if (orders.length === 0) return null



  const items = flattenOrdersToLineItems(orders)

  const latest = orders.reduce((a, b) =>

    new Date(a.createdAt) > new Date(b.createdAt) ? a : b

  )



  return {

    ...latest,

    tableName,

    items,

    total: computeOrderTotal(items),

  }

}


