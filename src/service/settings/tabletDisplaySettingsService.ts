import mongoServer from "@/config/mongoConfig"

import { TabletDisplaySettings } from "@/model/tabletDisplaySettings"

import {
  DEFAULT_TABLET_TEXT_SCALE,
  DEFAULT_TABLET_UI_SCALE,
  normalizeTabletTextScale,
  normalizeTabletUiScale,
} from "@/utils/tabletUiScale"
import {
  DEFAULT_TABLET_THEME,
  normalizeTabletTheme,
  type TabletThemeId,
} from "@/utils/tabletTheme"

import { lookupRestaurantIdentity } from "@/lib/resolveRestaurantIdentity"
import { merchantMenuQuery } from "@/utils/menuMerchantScope"
import { Menu } from "@/model/menu"
import { MenuOrder } from "@/model/menuOrder"
import { TableLayout } from "@/model/tableLayout"
import { Order } from "@/model/order"
import { Merchants } from "@/model/merchants"
import { Restaurant } from "@/model/restaurant"
import { Types } from "mongoose"

export type TabletDisplaySettingsDto = {
  uiScale: number
  textScale: number
  theme: TabletThemeId
}

function toDto(doc: {
  uiScale?: unknown
  textScale?: unknown
  theme?: unknown
}): TabletDisplaySettingsDto {
  return {
    uiScale: normalizeTabletUiScale(doc.uiScale ?? DEFAULT_TABLET_UI_SCALE),
    textScale: normalizeTabletTextScale(
      doc.textScale ?? DEFAULT_TABLET_TEXT_SCALE
    ),
    theme: normalizeTabletTheme(doc.theme ?? DEFAULT_TABLET_THEME),
  }
}

function merchantIdMatchQuery(merchantObjectId: Types.ObjectId) {
  const idHex = merchantObjectId.toHexString()
  return {
    $or: [{ merchantId: merchantObjectId }, { merchantId: idHex }],
  }
}

/** Resolve Restaurant._id for tablet display settings (same merchant as consumer URL). */
export async function resolveRestaurantIdForTabletSettings(
  merchantId: Types.ObjectId | string
): Promise<Types.ObjectId | null> {
  await mongoServer()

  const merchantObjectId =
    typeof merchantId === "string"
      ? new Types.ObjectId(merchantId)
      : merchantId

  const identity = await lookupRestaurantIdentity(String(merchantObjectId))
  if (identity.restaurantId) {
    return identity.restaurantId
  }

  const menu = await Menu.findOne(merchantMenuQuery(merchantObjectId))
    .select("restaurantId")
    .lean()
  if (menu?.restaurantId) {
    return new Types.ObjectId(String(menu.restaurantId))
  }

  const menuOrder = await MenuOrder.findOne({
    merchantId: merchantObjectId,
  })
    .select("restaurantId")
    .lean()
  if (menuOrder?.restaurantId) {
    return new Types.ObjectId(String(menuOrder.restaurantId))
  }

  const layout = await TableLayout.findOne(merchantIdMatchQuery(merchantObjectId))
    .select("restaurantId")
    .lean()
  if (layout?.restaurantId) {
    return new Types.ObjectId(String(layout.restaurantId))
  }

  const order = await Order.findOne(merchantIdMatchQuery(merchantObjectId))
    .select("restaurantId")
    .lean()
  if (order?.restaurantId) {
    return new Types.ObjectId(String(order.restaurantId))
  }

  const merchantDoc = await Merchants.findById(merchantObjectId)
    .select("uid")
    .lean()
  if (merchantDoc?.uid?.startsWith("r-")) {
    const slug = merchantDoc.uid.slice(2).trim().toLowerCase()
    const restaurantBySlug = await Restaurant.findOne({ slug })
      .select("_id")
      .lean()
    if (restaurantBySlug?._id) {
      return new Types.ObjectId(String(restaurantBySlug._id))
    }
  }

  const { resolveRestaurantIdForMerchant } = await import("@/lib/tenant")
  return resolveRestaurantIdForMerchant(merchantObjectId)
}

export async function getOrCreateTabletDisplaySettings(
  restaurantId: Types.ObjectId
): Promise<TabletDisplaySettingsDto> {
  await mongoServer()

  let doc = await TabletDisplaySettings.findOne({ restaurantId }).lean()
  if (!doc) {
    const created = await TabletDisplaySettings.create({
      restaurantId,
      uiScale: DEFAULT_TABLET_UI_SCALE,
      textScale: DEFAULT_TABLET_TEXT_SCALE,
      theme: DEFAULT_TABLET_THEME,
    })
    doc = created.toObject()
  }

  return toDto(doc)
}

export async function getTabletDisplaySettingsByRestaurantId(
  restaurantId: Types.ObjectId
): Promise<TabletDisplaySettingsDto | null> {
  await mongoServer()
  const doc = await TabletDisplaySettings.findOne({ restaurantId }).lean()
  if (!doc) return null
  return toDto(doc)
}

export async function getTabletDisplaySettingsForMerchantId(
  merchantId: Types.ObjectId | string
): Promise<TabletDisplaySettingsDto> {
  const restaurantId = await resolveRestaurantIdForTabletSettings(merchantId)

  if (!restaurantId) {
    return {
      uiScale: DEFAULT_TABLET_UI_SCALE,
      textScale: DEFAULT_TABLET_TEXT_SCALE,
      theme: DEFAULT_TABLET_THEME,
    }
  }

  return getOrCreateTabletDisplaySettings(restaurantId)
}

/** @deprecated Use getTabletDisplaySettingsForMerchantId */
export async function getTabletUiScaleForMerchantId(
  merchantId: Types.ObjectId | string
): Promise<number> {
  const settings = await getTabletDisplaySettingsForMerchantId(merchantId)
  return settings.uiScale
}

export async function updateTabletDisplaySettings(
  restaurantId: Types.ObjectId,
  values: { uiScale?: unknown; textScale?: unknown; theme?: unknown }
): Promise<TabletDisplaySettingsDto> {
  await mongoServer()

  const update: Record<string, number | string> = {}
  if (values.uiScale !== undefined) {
    update.uiScale = normalizeTabletUiScale(values.uiScale)
  }
  if (values.textScale !== undefined) {
    update.textScale = normalizeTabletTextScale(values.textScale)
  }
  if (values.theme !== undefined) {
    update.theme = normalizeTabletTheme(values.theme)
  }

  const doc = await TabletDisplaySettings.findOneAndUpdate(
    { restaurantId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()

  return toDto(doc ?? update)
}