import mongoServer from "@/config/mongoConfig";
import { Order, OrderStatus } from "@/model/order";
import { sendRJResponse } from "@/utils/api";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";

const ACTIVE_STATUSES: OrderStatus[] = ["new", "accepted", "cooking"];

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const merchantId = req.nextUrl.searchParams.get("merchantId");
    const query: Record<string, unknown> = {
      status: { $in: ACTIVE_STATUSES },
    };

    if (merchantId && isValidObjectId(merchantId)) {
      query.merchantId = new Types.ObjectId(merchantId);
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    return sendRJResponse({
      success: true,
      message: "Kitchen orders fetched",
      data: orders,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await mongoServer();

    const { orderId, status } = await req.json();

    if (!orderId || !isValidObjectId(orderId)) {
      return sendRJResponse({
        success: false,
        message: "Valid order id is required",
        status: 400,
      });
    }

    const allowed: OrderStatus[] = ["new", "accepted", "cooking", "done"];
    if (!allowed.includes(status)) {
      return sendRJResponse({
        success: false,
        message: "Invalid status",
        status: 400,
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).lean();

    if (!order) {
      return sendRJResponse({
        success: false,
        message: "Order not found",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Order status updated",
      data: order,
      status: 200,
    });
  } catch (error) {
    console.error("Error updating kitchen order:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
