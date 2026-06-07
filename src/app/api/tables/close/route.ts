import mongoServer from "@/config/mongoConfig";
import { Order } from "@/model/order";
import { sendRJResponse } from "@/utils/api";
import { ACTIVE_TABLE_ORDER_STATUSES } from "@/utils/tableManagement";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await mongoServer();

    const body = await req.json();
    const { tableName, merchantId } = body;

    if (!tableName || typeof tableName !== "string") {
      return sendRJResponse({
        success: false,
        message: "Table name is required",
        status: 400,
      });
    }

    const filter: Record<string, unknown> = {
      tableName: tableName.trim(),
      status: { $in: ACTIVE_TABLE_ORDER_STATUSES },
    };

    if (merchantId && isValidObjectId(merchantId)) {
      filter.merchantId = new Types.ObjectId(merchantId);
    }

    const result = await Order.updateMany(filter, { status: "closed" });

    return sendRJResponse({
      success: true,
      message: "Table closed",
      data: { modifiedCount: result.modifiedCount },
      status: 200,
    });
  } catch (error) {
    console.error("Error closing table:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
