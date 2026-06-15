import { MERCHANT_TOKEN_COOKIE } from "@/lib/auth";
import { resolveMerchantIdForRestaurant } from "@/lib/tenant";
import {
  PLATFORM_SUPPORT_COOKIE,
  type PlatformSupportPayload,
} from "@/lib/platformSupport";
import { Merchants } from "@/model/merchants";
import { tokenGenerator } from "@/utils/jwt";
import { Types } from "mongoose";
import { NextResponse } from "next/server";

const MERCHANT_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24,
} as const;

const SUPPORT_META_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24,
} as const;

export async function buildMerchantTokenForRestaurant(
  restaurantId: Types.ObjectId
): Promise<string | null> {
  const merchantId = await resolveMerchantIdForRestaurant(restaurantId);
  if (!merchantId) {
    return null;
  }

  const merchant = await Merchants.findById(merchantId).select("uid").lean();
  if (!merchant?.uid) {
    return null;
  }

  return tokenGenerator({ merchantId, uid: merchant.uid });
}

export async function applyPlatformSupportContext(
  res: NextResponse,
  restaurantId: Types.ObjectId,
  restaurantName: string
): Promise<boolean> {
  const merchantToken = await buildMerchantTokenForRestaurant(restaurantId);
  if (!merchantToken) {
    return false;
  }

  const payload: PlatformSupportPayload = {
    restaurantId: String(restaurantId),
    restaurantName,
  };

  res.cookies.set(MERCHANT_TOKEN_COOKIE, merchantToken, MERCHANT_COOKIE_OPTIONS);
  res.cookies.set(
    PLATFORM_SUPPORT_COOKIE,
    encodeURIComponent(JSON.stringify(payload)),
    SUPPORT_META_COOKIE_OPTIONS
  );

  return true;
}

export function clearPlatformSupportContext(res: NextResponse): void {
  const expired = { expires: new Date(0), path: "/" };

  res.cookies.set(MERCHANT_TOKEN_COOKIE, "", {
    ...expired,
    httpOnly: true,
  });
  res.cookies.set(PLATFORM_SUPPORT_COOKIE, "", {
    ...expired,
    httpOnly: false,
  });
}
