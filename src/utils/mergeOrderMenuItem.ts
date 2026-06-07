import { KitchenOrder } from "@/types/kitchenOrder"
import { IMenu } from "@/types/menu"
import type { BilingualMenuSize } from "@/utils/menuBilingual"
import { buildKitchenOrderLineFromMenu } from "@/utils/orderItemPricing"

export function mergeMenuItemIntoOrder(
  items: KitchenOrder["items"],
  menu: IMenu,
  size?: BilingualMenuSize
): KitchenOrder["items"] | null {
  const line = buildKitchenOrderLineFromMenu(menu, size)
  if (!line) return null

  const menuItemId = line.menuItemId
  const price = line.price
  const selectedSizeLabelMn = line.selectedSizeLabelMn
  const selectedSizeLabelEn = line.selectedSizeLabelEn

  const index = items.findIndex(
    (row) =>
      row.menuItemId === menuItemId &&
      row.price === price &&
      (row.selectedSizeLabelMn ?? "") === (selectedSizeLabelMn ?? "") &&
      (row.selectedSizeLabelEn ?? "") === (selectedSizeLabelEn ?? "")
  )

  if (index >= 0) {
    const next = [...items]
    next[index] = {
      ...next[index],
      quantity: next[index].quantity + 1,
    }
    return next
  }

  return [...items, line]
}
