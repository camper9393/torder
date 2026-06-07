import type { MenuSizeOption } from "@/types/menu"

export const MENU_ITEM_DRAG_MIME = "application/x-menu-item"

export type MenuItemSectionSource = {
  id: string
  nameMn: string
  nameEn: string
  descriptionMn?: string
  descriptionEn?: string
  price: number
  section: string
  spicyLevel: number
  available: boolean
  sizes?: MenuSizeOption[]
}

export function buildSectionUpdateFormData(
  item: MenuItemSectionSource,
  newSection: string
): FormData {
  const formData = new FormData()
  formData.append("nameMn", item.nameMn)
  formData.append("nameEn", item.nameEn)
  formData.append("descriptionMn", item.descriptionMn ?? "")
  formData.append("descriptionEn", item.descriptionEn ?? "")
  formData.append("price", String(item.price))
  formData.append("section", newSection)
  formData.append("spicyLevel", String(item.spicyLevel))
  formData.append("available", item.available ? "true" : "false")
  formData.append("quantity", "0")
  if (item.sizes?.length) {
    formData.append("sizesJson", JSON.stringify(item.sizes))
  }
  return formData
}
