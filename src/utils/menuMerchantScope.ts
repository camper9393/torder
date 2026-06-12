import { Types } from "mongoose"

/** Normalize JWT / auth payload to a MongoDB ObjectId (same format for find + insert). */
export function toMerchantObjectId(id: unknown): Types.ObjectId {
  if (id instanceof Types.ObjectId) return id
  const s = String(id ?? "").trim()
  if (!Types.ObjectId.isValid(s)) {
    throw new Error(`Invalid merchantId: ${s || "(empty)"}`)
  }
  return new Types.ObjectId(s)
}

/**
 * Match menus for a merchant whether legacy rows stored merchantId as
 * ObjectId or string (fixes seed vs list mismatch).
 */
export function merchantMenuQuery(
  merchantObjectId: Types.ObjectId,
  extra: Record<string, unknown> = {}
) {
  const idHex = merchantObjectId.toHexString()
  return {
    ...extra,
    $or: [{ merchantId: merchantObjectId }, { merchantId: idHex }],
  }
}

export function scopedMerchantMenuQuery(
  merchantObjectId: Types.ObjectId,
  restaurantId?: Types.ObjectId | null,
  extra: Record<string, unknown> = {}
) {
  const query = merchantMenuQuery(merchantObjectId, extra)
  if (!restaurantId) return query
  return { ...query, restaurantId }
}
