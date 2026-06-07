import type { CheckOutItems } from "@/store/reducer/checkout"
import { parseMoneyAmount } from "@/utils/parseMoneyAmount"
import type { RawOrderItemLike } from "@/utils/orderItemPricing"

/** Menu DB stock placeholder — never use as order line quantity. */
export const MENU_INVENTORY_STOCK_DEFAULT = 999

function selectedSizePrice(raw: RawOrderItemLike): unknown {
  const size = raw.selectedSize
  if (size && typeof size === "object" && !Array.isArray(size)) {
    return (size as { price?: unknown }).price
  }
  return undefined
}

function menuItemPrice(raw: RawOrderItemLike): unknown {
  const menu = raw.menuItem
  if (menu && typeof menu === "object" && !Array.isArray(menu)) {
    return (menu as { price?: unknown }).price
  }
  return undefined
}

/** Order unit price only — never table name or menu stock quantity. */
export function resolveOrderLinePrice(raw: RawOrderItemLike): number {
  const candidates: unknown[] = [
    selectedSizePrice(raw),
    raw.selectedPrice,
    raw.unitPrice,
    raw.price,
    menuItemPrice(raw),
  ]

  for (const candidate of candidates) {
    const n = Number(candidate)
    if (Number.isFinite(n) && n > 0) {
      return n
    }
    const parsed = parseMoneyAmount(candidate)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return NaN
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
  if (!Number.isFinite(price) || price <= 0) {
    console.error("INVALID PRICE ITEM", raw)
    throw new Error("Invalid item price")
  }
  return price
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
  const price = validateOrderLinePrice(resolveOrderLinePrice(item), item)
  const quantity = resolveOrderLineQuantity(item)
  const id = item._id ?? item.menuItemId
  if (!id) {
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
