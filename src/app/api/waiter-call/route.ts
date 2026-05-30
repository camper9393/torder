import mongoServer from "@/config/mongoConfig";
import { WaiterCall } from "@/model/waiterCall";
import { sendRJResponse } from "@/utils/api";
import { normalizeTableName } from "@/utils/table";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";

const ACTIVE_STATUSES = ["new", "accepted"];

export async function POST(req: NextRequest) {
  try {
    await mongoServer();

    const { merchantId, tableName } = await req.json();

    if (!merchantId || !isValidObjectId(merchantId)) {
      return sendRJResponse({
        success: false,
        message: "Valid merchant id is required",
        status: 400,
      });
    }

    const resolvedTableName = normalizeTableName(
      typeof tableName === "string" ? tableName : undefined
    );

    const call = await WaiterCall.create({
      merchantId: new Types.ObjectId(merchantId),
      tableName: resolvedTableName,
      type: "waiter_call",
      status: "new",
    });

    return sendRJResponse({
      success: true,
      message: "Waiter call created",
      data: call,
      status: 201,
    });
  } catch (error) {
    console.error("Error creating waiter call:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const merchantId = req.nextUrl.searchParams.get("merchantId");
    const query: Record<string, unknown> = {
      type: "waiter_call",
      status: { $in: ACTIVE_STATUSES },
    };

    if (merchantId && isValidObjectId(merchantId)) {
      query.merchantId = new Types.ObjectId(merchantId);
    }

    const calls = await WaiterCall.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return sendRJResponse({
      success: true,
      message: "Waiter calls fetched",
      data: calls,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching waiter calls:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
