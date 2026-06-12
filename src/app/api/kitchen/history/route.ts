import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Order } from "@/model/order";
import { sendRJResponse } from "@/utils/api";
import { serializeKitchenOrder } from "@/utils/serializeKitchenOrder";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";
import { resolveRestaurantIdForMerchant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const authMerchantId = await resolveMerchantId(req);
    const merchantIdParam = req.nextUrl.searchParams.get("merchantId");
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitParam) || 200, 1), 500);

    const query: Record<string, unknown> = {
      status: { $in: ["done", "closed"] },
    };

    let merchantObjectId: Types.ObjectId | null = null;
    if (authMerchantId) {
      merchantObjectId = authMerchantId;
    } else if (merchantIdParam && isValidObjectId(merchantIdParam)) {
      merchantObjectId = new Types.ObjectId(merchantIdParam);
    }

    if (merchantObjectId) {
      query.merchantId = merchantObjectId;
      const restaurantId = await resolveRestaurantIdForMerchant(merchantObjectId);
      if (restaurantId) {
        query.restaurantId = restaurantId;
      }
    }

    const orders = await Order.find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return sendRJResponse({
      success: true,
      message: "Order history fetched",
      data: orders.map((doc) => serializeKitchenOrder(doc)),
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching order history:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
