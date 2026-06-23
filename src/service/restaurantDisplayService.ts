import mongoServer from "@/config/mongoConfig"
import { Restaurant } from "@/model/restaurant"
import { resolveRestaurantIdForTabletSettings } from "@/service/settings/tabletDisplaySettingsService"
import { Types } from "mongoose"

export const DEFAULT_RESTAURANT_DISPLAY_NAME = "Ресторан"

/** Canonical display name from restaurants collection (single source of truth). */
export async function getRestaurantDisplayNameForMerchantId(
  merchantId: Types.ObjectId | string
): Promise<string> {
  await mongoServer()

  const restaurantId = await resolveRestaurantIdForTabletSettings(merchantId)
  if (!restaurantId) {
    return DEFAULT_RESTAURANT_DISPLAY_NAME
  }

  const restaurant = await Restaurant.findById(restaurantId).select("name").lean()
  const name = restaurant?.name?.trim()
  return name || DEFAULT_RESTAURANT_DISPLAY_NAME
}
