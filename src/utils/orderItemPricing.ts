import { KitchenOrder } from "@/types/kitchenOrder"

import type { IMenu } from "@/types/menu"

import {

  type BilingualMenuSize,

  buildTitleFromNames,

  normalizeMenuDocument,

} from "@/utils/menuBilingual"

import {

  resolveOrderLinePrice,

  resolveOrderLineQuantity,

  validateOrderLinePrice,

  type RawOrderItemLike,

} from "@/utils/orderLineMapping"



export type KitchenOrderLineItem = KitchenOrder["items"][number]



export { parseMoneyAmount } from "@/utils/parseMoneyAmount"



export type { RawOrderItemLike }



/** @deprecated Use resolveOrderLinePrice */

export function resolveOrderItemUnitPriceFromInput(

  raw: RawOrderItemLike

): number {

  return resolveOrderLinePrice(raw)

}



export function assertValidOrderItemPrice(price: number): number {

  return validateOrderLinePrice(price, { price })

}



function matchSizeFromLabels(

  sizes: BilingualMenuSize[],

  labelMn?: string,

  labelEn?: string

): BilingualMenuSize | undefined {

  const mn = String(labelMn ?? "").trim().toLowerCase()

  const en = String(labelEn ?? "").trim().toLowerCase()

  if (!mn && !en) return undefined



  return sizes.find((s) => {

    const smn = (s.labelMn ?? s.label ?? "").trim().toLowerCase()

    const sen = (s.labelEn ?? s.label ?? "").trim().toLowerCase()

    return (mn && smn === mn) || (en && sen === en)

  })

}



/** Build one kitchen order line with a numeric unit price from menu + optional portion. */

export function buildKitchenOrderLineFromMenu(

  menu: IMenu,

  size?: BilingualMenuSize

): KitchenOrderLineItem | null {

  const normalized = normalizeMenuDocument(menu)

  const sizes = normalized.sizes ?? []



  let chosen = size

  if (!chosen && sizes.length === 1) {

    chosen = sizes[0]

  }

  if (!chosen && sizes.length > 1) {

    return null

  }



  const unitPrice = validateOrderLinePrice(

    resolveOrderLinePrice({

      selectedSize: chosen,

      price: chosen ? undefined : normalized.price,

    }),

    menu

  )



  return {

    menuItemId: String(menu._id),

    title: normalized.title,

    nameMn: normalized.nameMn || undefined,

    nameEn: normalized.nameEn || undefined,

    selectedSizeLabelMn: chosen?.labelMn,

    selectedSizeLabelEn: chosen?.labelEn,

    price: unitPrice,

    quantity: 1,

    image: menu.image,

  }

}



/** Build line from menu doc + optional size labels when payload price is missing. */

export function buildKitchenOrderLineFromMenuAndLabels(

  menu: IMenu,

  labels?: { selectedSizeLabelMn?: string; selectedSizeLabelEn?: string }

): KitchenOrderLineItem | null {

  const normalized = normalizeMenuDocument(menu)

  const sizes = normalized.sizes ?? []

  const matched = matchSizeFromLabels(

    sizes,

    labels?.selectedSizeLabelMn,

    labels?.selectedSizeLabelEn

  )



  if (sizes.length > 1 && !matched) {

    return null

  }



  const chosen = matched ?? (sizes.length === 1 ? sizes[0] : undefined)

  return buildKitchenOrderLineFromMenu(menu, chosen)

}



export function normalizeOrderItemsForSave(

  items: RawOrderItemLike[]

): KitchenOrderLineItem[] {

  const normalized: KitchenOrderLineItem[] = []



  for (const raw of items) {

    const price = validateOrderLinePrice(resolveOrderLinePrice(raw), raw)

    const quantity = resolveOrderLineQuantity(raw)



    const title =

      String(raw.title ?? "").trim() ||

      buildTitleFromNames(

        String(raw.nameMn ?? "").trim(),

        String(raw.nameEn ?? "").trim()

      )



    if (!title) {

      throw new Error("Invalid item price")

    }



    normalized.push({

      menuItemId: raw.menuItemId,

      title,

      nameMn: raw.nameMn != null ? String(raw.nameMn).trim() || undefined : undefined,

      nameEn: raw.nameEn != null ? String(raw.nameEn).trim() || undefined : undefined,

      selectedSizeLabelMn:

        raw.selectedSizeLabelMn != null

          ? String(raw.selectedSizeLabelMn).trim() || undefined

          : undefined,

      selectedSizeLabelEn:

        raw.selectedSizeLabelEn != null

          ? String(raw.selectedSizeLabelEn).trim() || undefined

          : undefined,

      price,

      quantity,

      image: typeof raw.image === "string" ? raw.image : undefined,

      served: raw.served === true,

    })

  }



  return normalized

}


