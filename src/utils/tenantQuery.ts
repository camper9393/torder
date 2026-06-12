import { resolveRestaurantIdForMerchant } from "@/lib/tenant";
import { Types } from "mongoose";

export function withRestaurantId<T extends Record<string, unknown>>(
  query: T,
  restaurantId?: Types.ObjectId | null
): T {
  if (!restaurantId) {
    return query;
  }
  return { ...query, restaurantId };
}

export function merchantAndRestaurantQuery(
  merchantId: Types.ObjectId,
  restaurantId?: Types.ObjectId | null,
  extra: Record<string, unknown> = {}
) {
  return withRestaurantId({ merchantId, ...extra }, restaurantId);
}

export async function scopedMerchantQuery(
  merchantId: Types.ObjectId,
  extra: Record<string, unknown> = {}
) {
  const restaurantId = await resolveRestaurantIdForMerchant(merchantId);
  return merchantAndRestaurantQuery(merchantId, restaurantId, extra);
}
