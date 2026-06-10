import { Menu } from "@/model/menu"

import type { IMenu } from "@/types/menu"

import { isValidObjectId, Types } from "mongoose"

import {

  resolveOrderLinePrice,

  resolveOrderLineQuantity,

} from "@/utils/orderLineMapping"

import {

  buildKitchenOrderLineFromMenuAndLabels,

  normalizeOrderItemsForSave,

  type KitchenOrderLineItem,

  type RawOrderItemLike,

} from "@/utils/orderItemPricing"



/**

 * Normalize order lines for MongoDB: resolve price from payload fields, then menu DB if needed.

 * Never uses tableName for pricing.

 */

export async function resolveOrderItemsForPersistence(

  items: RawOrderItemLike[],

  merchantId: Types.ObjectId

): Promise<KitchenOrderLineItem[]> {

  const resolved: KitchenOrderLineItem[] = []



  for (const raw of items) {

    const payloadPrice = resolveOrderLinePrice(raw)



    if (Number.isFinite(payloadPrice) && payloadPrice >= 0) {

      const [line] = normalizeOrderItemsForSave([

        { ...raw, price: payloadPrice },

      ])

      resolved.push(line)

      continue

    }



    const fromMenu = await resolveLineFromMenuItemId(raw, merchantId)

    if (!fromMenu) {

      throw new Error("Invalid item price")

    }



    resolved.push({

      ...fromMenu,

      quantity: resolveOrderLineQuantity(raw),

      image: typeof raw.image === "string" ? raw.image : fromMenu.image,

      served: raw.served === true,

    })

  }



  return resolved

}



async function resolveLineFromMenuItemId(

  raw: RawOrderItemLike,

  merchantId: Types.ObjectId

): Promise<KitchenOrderLineItem | null> {

  const id = raw.menuItemId

  if (!id || !isValidObjectId(id)) {

    return null

  }



  const doc = await Menu.findOne({

    _id: new Types.ObjectId(id),

    merchantId,

  }).lean()



  if (!doc) {

    return null

  }



  return buildKitchenOrderLineFromMenuAndLabels(doc as IMenu, {

    selectedSizeLabelMn:

      typeof raw.selectedSizeLabelMn === "string"

        ? raw.selectedSizeLabelMn

        : undefined,

    selectedSizeLabelEn:

      typeof raw.selectedSizeLabelEn === "string"

        ? raw.selectedSizeLabelEn

        : undefined,

  })

}


