import mongoServer from "@/config/mongoConfig";
import { Order } from "@/model/order";
import { sendRJResponse } from "@/utils/api";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const merchantId = req.nextUrl.searchParams.get("merchantId");
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitParam) || 200, 1), 500);

    const query: Record<string, unknown> = { status: "done" };

    if (merchantId && isValidObjectId(merchantId)) {
      query.merchantId = new Types.ObjectId(merchantId);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return sendRJResponse({
      success: true,
      message: "Order history fetched",
      data: orders,
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
