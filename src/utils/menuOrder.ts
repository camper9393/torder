export function mergeSectionOrder(
  labels: string[],
  savedOrder: string[] | null | undefined,
  defaultOrder: string[]
): string[] {
  const labelSet = new Set(labels)
  const base = savedOrder?.length
    ? [
        ...savedOrder.filter((l) => labelSet.has(l)),
        ...labels.filter((l) => !savedOrder.includes(l)),
      ]
    : defaultOrder.filter((l) => labelSet.has(l)).concat(
        labels.filter((l) => !defaultOrder.includes(l))
      )

  return base.length > 0 ? base : [...labels]
}

export function mergeItemOrder(
  itemIds: string[],
  savedOrder: string[] | null | undefined
): string[] {
  if (!savedOrder?.length) return itemIds
  const idSet = new Set(itemIds)
  const ordered = savedOrder.filter((id) => idSet.has(id))
  const rest = itemIds.filter((id) => !savedOrder.includes(id))
  return [...ordered, ...rest]
}

export function reorderItemIds(
  ids: string[],
  draggedId: string,
  insertAt: number
): string[] {
  const from = ids.indexOf(draggedId)
  if (from === -1) return ids

  let to = Math.max(0, Math.min(insertAt, ids.length))
  if (from < to) to -= 1
  if (from === to) return ids

  const next = [...ids]
  next.splice(from, 1)
  next.splice(to, 0, draggedId)
  return next
}

export function naturalSectionOrder(items: { section: string }[]): string[] {
  const seen = new Set<string>()
  const order: string[] = []
  for (const item of items) {
    if (!seen.has(item.section)) {
      seen.add(item.section)
      order.push(item.section)
    }
  }
  return order
}

function itemIdOf(item: { _id?: unknown; id?: string }): string {
  if (item.id) return String(item.id)
  return String(item._id ?? "")
}

export function buildSectionItemOrders(
  items: { id: string; section: string }[],
  savedItemOrders: Record<string, string[]> = {}
): Record<string, string[]> {
  const grouped = new Map<string, string[]>()
  for (const item of items) {
    const list = grouped.get(item.section) ?? []
    list.push(item.id)
    grouped.set(item.section, list)
  }

  const orders: Record<string, string[]> = {}
  for (const [section, ids] of grouped) {
    orders[section] = mergeItemOrder(ids, savedItemOrders[section] ?? null)
  }
  return orders
}

export function applyMenuOrdering<
  T extends { section: string; _id?: unknown; id?: string },
>(
  items: T[],
  sectionOrder: string[] | null | undefined,
  itemOrders: Record<string, string[]> | null | undefined,
  defaultSectionOrder?: string[]
): T[] {
  const bySection = new Map<string, T[]>()
  for (const item of items) {
    const list = bySection.get(item.section) ?? []
    list.push(item)
    bySection.set(item.section, list)
  }

  const labels = Array.from(bySection.keys())
  const natural = naturalSectionOrder(items)
  const fallbackDefault =
    defaultSectionOrder?.length
      ? defaultSectionOrder
          .filter((section) => bySection.has(section))
          .concat(labels.filter((label) => !defaultSectionOrder.includes(label)))
      : natural

  const sections = mergeSectionOrder(labels, sectionOrder, fallbackDefault)
  const result: T[] = []

  for (const section of sections) {
    const sectionItems = bySection.get(section) ?? []
    const ids = sectionItems.map(itemIdOf)
    const orderedIds = mergeItemOrder(ids, itemOrders?.[section] ?? null)
    const byId = new Map(sectionItems.map((item) => [itemIdOf(item), item]))
    for (const id of orderedIds) {
      const item = byId.get(id)
      if (item) result.push(item)
    }
  }

  return result
}

export function sanitizeItemOrders(
  itemOrders: Record<string, string[]> | null | undefined
): Record<string, string[]> {
  if (!itemOrders || typeof itemOrders !== "object") return {}
  const next: Record<string, string[]> = {}
  for (const [section, ids] of Object.entries(itemOrders)) {
    if (!Array.isArray(ids)) continue
    next[section] = ids.filter((id): id is string => typeof id === "string")
  }
  return next
}
