import { KitchenOrder } from "@/types/kitchenOrder"

export type HistorySection = {
  id: string
  label: string
  orders: KitchenOrder[]
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export function filterOrdersToday(orders: KitchenOrder[]): KitchenOrder[] {
  const today = startOfDay(new Date())
  return orders.filter((order) => isSameDay(new Date(order.createdAt), today))
}

export function groupOrdersForHistory(orders: KitchenOrder[]): HistorySection[] {
  const now = new Date()
  const today = startOfDay(now)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayOrders: KitchenOrder[] = []
  const yesterdayOrders: KitchenOrder[] = []
  const olderByDate = new Map<string, KitchenOrder[]>()

  for (const order of orders) {
    const placed = new Date(order.createdAt)

    if (isSameDay(placed, today)) {
      todayOrders.push(order)
      continue
    }

    if (isSameDay(placed, yesterday)) {
      yesterdayOrders.push(order)
      continue
    }

    const dateKey = startOfDay(placed).toISOString().slice(0, 10)
    if (!olderByDate.has(dateKey)) {
      olderByDate.set(dateKey, [])
    }
    olderByDate.get(dateKey)!.push(order)
  }

  const sections: HistorySection[] = []

  if (todayOrders.length > 0) {
    sections.push({ id: "today", label: "Today", orders: todayOrders })
  }

  if (yesterdayOrders.length > 0) {
    sections.push({
      id: "yesterday",
      label: "Yesterday",
      orders: yesterdayOrders,
    })
  }

  const olderKeys = Array.from(olderByDate.keys()).sort((a, b) =>
    b.localeCompare(a)
  )

  for (const dateKey of olderKeys) {
    const label = new Date(dateKey + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    sections.push({
      id: `older-${dateKey}`,
      label,
      orders: olderByDate.get(dateKey)!,
    })
  }

  return sections
}

/** @deprecated Use groupOrdersForHistory */
export type OrderDateGroup = HistorySection

/** @deprecated Use groupOrdersForHistory */
export function groupOrdersByDate(orders: KitchenOrder[]): HistorySection[] {
  return groupOrdersForHistory(orders)
}
