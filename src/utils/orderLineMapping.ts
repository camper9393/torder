import type { CheckOutItems } from "@/store/reducer/checkout"
import { parseMoneyAmount } from "@/utils/parseMoneyAmount"

/** Raw order line from client/API — price may live on several fields (never tableName). */
export type RawOrderItemLike = {
  menuItemId?: string
  title?: string
  nameMn?: string
  nameEn?: string
  selectedSizeLabelMn?: string
  selectedSizeLabelEn?: string
  price?: unknown
  selectedPrice?: unknown
  selectedSize?: unknown
  size?: unknown
  unitPrice?: unknown
  menuItem?: unknown
  itemCount?: unknown
  qty?: unknown
  count?: unknown
  orderQuantity?: unknown
  quantity?: unknown
  image?: string
  served?: boolean
}

/** Menu DB stock placeholder — never use as order line quantity. */
export const MENU_INVENTORY_STOCK_DEFAULT = 999

function readUnitPrice(value: unknown): number {
  const parsed = parseMoneyAmount(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN
}

function selectedSizePrice(raw: RawOrderItemLike): unknown {
  const size = raw.selectedSize ?? raw.size
  if (size && typeof size === "object" && !Array.isArray(size)) {
    return (size as { price?: unknown }).price
  }
  return undefined
}

function menuItemPrice(raw: RawOrderItemLike): unknown {
  const menu = raw.menuItem
  if (menu && typeof menu === "object" && !Array.isArray(menu)) {
    const record = menu as Record<string, unknown>
    return (
      record.price ??
      record.salePrice ??
      record.selectedPrice ??
      record.finalPrice ??
      record.unitPrice
    )
  }
  return undefined
}

function firstValidPortionPrice(raw: RawOrderItemLike): number {
  const sources = [raw, raw.menuItem].filter(
    (v): v is object => v != null && typeof v === "object" && !Array.isArray(v)
  )

  for (const source of sources) {
    const sizes = (source as { sizes?: unknown }).sizes
    if (!Array.isArray(sizes)) continue

    for (const size of sizes) {
      if (!size || typeof size !== "object") continue
      const parsed = readUnitPrice((size as { price?: unknown }).price)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return NaN
}

function priceFromSizeLabels(raw: RawOrderItemLike): number {
  const labelMn = String(raw.selectedSizeLabelMn ?? "").trim().toLowerCase()
  const labelEn = String(raw.selectedSizeLabelEn ?? "").trim().toLowerCase()
  if (!labelMn && !labelEn) return NaN

  const sources = [raw, raw.menuItem].filter(
    (v): v is object => v != null && typeof v === "object" && !Array.isArray(v)
  )

  for (const source of sources) {
    const sizes = (source as { sizes?: unknown }).sizes
    if (!Array.isArray(sizes)) continue

    for (const size of sizes) {
      if (!size || typeof size !== "object") continue
      const row = size as {
        price?: unknown
        labelMn?: string
        labelEn?: string
        label?: string
      }
      const smn = String(row.labelMn ?? row.label ?? "")
        .trim()
        .toLowerCase()
      const sen = String(row.labelEn ?? "").trim().toLowerCase()
      const matches =
        (labelMn && smn === labelMn) ||
        (labelEn && sen === labelEn) ||
        (labelMn && smn && smn.includes(labelMn)) ||
        (labelEn && sen && sen.includes(labelEn))
      if (!matches) continue

      const parsed = readUnitPrice(row.price)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return NaN
}

/** Order unit price only — never table name or menu stock quantity. */
export function resolveOrderLinePrice(raw: RawOrderItemLike): number {
  const record = raw as Record<string, unknown>

  const candidates: unknown[] = [
    selectedSizePrice(raw),
    raw.selectedPrice,
    record.finalPrice,
    record.salePrice,
    raw.unitPrice,
    raw.price,
    menuItemPrice(raw),
    firstValidPortionPrice(raw),
  ]

  for (const candidate of candidates) {
    const parsed = readUnitPrice(candidate)
    if (Number.isFinite(parsed)) return parsed
  }

  const fromLabels = priceFromSizeLabels(raw)
  if (Number.isFinite(fromLabels)) return fromLabels

  return NaN
}

export function logOrderPriceDebug(
  label: string,
  raw: unknown,
  unitPrice: number,
  quantity: number
): void {
  console.debug("[order-price]", {
    label,
    rawMenuItem: raw,
    extractedUnitPrice: unitPrice,
    quantity,
    calculatedTotal:
      Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice * quantity : 0,
  })
}

/** Resolve a sellable unit price for cart/order lines; null when missing. */
export function resolveMenuUnitPrice(
  raw: RawOrderItemLike,
  options?: { debugLabel?: string; quantity?: number }
): number | null {
  const unitPrice = resolveOrderLinePrice(raw)
  const quantity = options?.quantity ?? resolveOrderLineQuantity(raw)

  if (Number.isFinite(unitPrice) && unitPrice >= 0) {
    logOrderPriceDebug(options?.debugLabel ?? "resolveMenuUnitPrice", raw, unitPrice, quantity)
    return unitPrice
  }

  console.warn("[order-price] Missing valid unit price", {
    label: options?.debugLabel,
    rawMenuItem: raw,
    extractedUnitPrice: unitPrice,
    quantity,
  })
  return null
}

type OrderQuantityInput = {
  itemCount?: unknown
  qty?: unknown
  count?: unknown
  orderQuantity?: unknown
  quantity?: unknown
}

function isValidOrderQuantity(n: number): boolean {
  return Number.isFinite(n) && n > 0 && n <= 99
}

/**
 * Order line quantity — prefers cart/order fields, never menu inventory `quantity` (often 999).
 */
export function resolveOrderLineQuantity(raw: OrderQuantityInput): number {
  const orderQtySources = [
    raw.itemCount,
    raw.qty,
    raw.count,
    raw.orderQuantity,
  ]

  for (const source of orderQtySources) {
    if (source == null) continue
    const n = Number(source)
    if (isValidOrderQuantity(n)) {
      return Math.floor(n)
    }
  }

  const maybeMenuQty = Number(raw.quantity)
  if (maybeMenuQty === MENU_INVENTORY_STOCK_DEFAULT) {
    console.warn("Ignoring menu stock quantity as order quantity", raw)
    return 1
  }

  if (isValidOrderQuantity(maybeMenuQty)) {
    return Math.floor(maybeMenuQty)
  }

  if (raw.quantity != null && !Number.isNaN(maybeMenuQty)) {
    console.warn("Invalid order quantity; defaulting to 1", raw)
  }

  return 1
}

export function validateOrderLinePrice(price: number, raw: unknown): number {
  if (Number.isFinite(price) && price >= 0) {
    return price
  }

  console.warn("Invalid order line price", {
    resolvedPrice: price,
    raw,
  })
  throw new Error("Invalid item price")
}

/** Strip menu stock fields; map checkout/cart lines for order APIs. */
export function mapCheckoutItemToOrderPayload(
  item: CheckOutItems & { _id?: string; menuItemId?: string }
): RawOrderItemLike & {
  menuItemId: string
  price: number
  selectedPrice: number
  quantity: number
} {
  const unitPrice =
    resolveMenuUnitPrice(item, {
      debugLabel: item.title ?? "checkout-line",
      quantity: resolveOrderLineQuantity(item),
    }) ?? NaN

  const price = validateOrderLinePrice(unitPrice, item)
  const quantity = resolveOrderLineQuantity(item)
  const id = item._id ?? item.menuItemId
  if (!id) {
    console.warn("Order line missing menu item id", item)
    throw new Error("Invalid item price")
  }

  return {
    menuItemId: String(id),
    title: item.title,
    nameMn: item.nameMn,
    nameEn: item.nameEn,
    selectedSizeLabelMn: item.selectedSizeLabelMn,
    selectedSizeLabelEn: item.selectedSizeLabelEn,
    price,
    selectedPrice: price,
    quantity,
    image: item.image,
  }
}
