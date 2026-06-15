import { NextRequest, NextResponse } from "next/server"
import { Merchants } from "@/model/merchants"
import mongoServer from "@/config/mongoConfig"
import { verifyToken } from "@/utils/jwt"
import { getCurrentUser, MERCHANT_TOKEN_COOKIE } from "@/lib/auth";
import {
  isPlatformOwner,
  resolveDefaultLegacyRestaurantId,
  resolveMerchantIdForRestaurant,
} from "@/lib/tenant"
import { Types } from "mongoose"

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const token = req.cookies.get(MERCHANT_TOKEN_COOKIE)?.value
    if (token) {
      const merchantId = verifyToken(token)
      if (merchantId) {
        const merchant = await Merchants.findById(merchantId).select("-password")
        if (merchant) {
          return NextResponse.json({
            success: true,
            data: merchant,
          })
        }
      }
    }

    const user = await getCurrentUser(req)
    if (user) {
      let restaurantId = user.restaurantId
        ? new Types.ObjectId(String(user.restaurantId))
        : null

      if (!restaurantId && isPlatformOwner(user)) {
        restaurantId = await resolveDefaultLegacyRestaurantId()
      }

      if (restaurantId) {
        const merchantId = await resolveMerchantIdForRestaurant(restaurantId)
        if (merchantId) {
          const merchant = await Merchants.findById(merchantId).select("-password")
          if (merchant) {
            return NextResponse.json({
              success: true,
              data: merchant,
            })
          }
        }
      }
    }

    return NextResponse.json({ success: false })
  } catch {
    return NextResponse.json({ success: false })
  }
}
