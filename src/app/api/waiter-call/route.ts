import mongoServer from "@/config/mongoConfig";
import { WaiterCall } from "@/model/waiterCall";
import { sendRJResponse } from "@/utils/api";
import { normalizeTableName } from "@/utils/table";
import {
  ACTIVE_WAITER_CALL_STATUSES,
  isValidWaiterCallTableName,
  waiterCallTableKey,
} from "@/utils/waiterCallTable";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";

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

    if (!isValidWaiterCallTableName(tableName)) {
      return sendRJResponse({
        success: false,
        message: "Valid table name is required",
        status: 400,
      });
    }

    const resolvedTableName = normalizeTableName(
      typeof tableName === "string" ? tableName : undefined
    );
    const merchantOid = new Types.ObjectId(merchantId);

    const existingCalls = await WaiterCall.find({
      merchantId: merchantOid,
      type: "waiter_call",
      status: { $in: ACTIVE_WAITER_CALL_STATUSES },
    })
      .sort({ createdAt: -1 })
      .lean();

    const tableKey = waiterCallTableKey(resolvedTableName);
    const existing = existingCalls.find(
      (call) => waiterCallTableKey(call.tableName) === tableKey
    );

    if (existing) {
      return sendRJResponse({
        success: true,
        message: "Waiter call already active",
        data: existing,
        status: 200,
      });
    }

    const call = await WaiterCall.create({
      merchantId: merchantOid,
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

export async function PATCH(req: NextRequest) {
  try {
    await mongoServer();

    const { merchantId, tableName, status = "done" } = await req.json();

    if (!merchantId || !isValidObjectId(merchantId)) {
      return sendRJResponse({
        success: false,
        message: "Valid merchant id is required",
        status: 400,
      });
    }

    if (!isValidWaiterCallTableName(tableName)) {
      return sendRJResponse({
        success: false,
        message: "Valid table name is required",
        status: 400,
      });
    }

    if (status !== "done" && status !== "accepted") {
      return sendRJResponse({
        success: false,
        message: "Invalid status",
        status: 400,
      });
    }

    const resolvedTableName = normalizeTableName(
      typeof tableName === "string" ? tableName : undefined
    );
    const merchantOid = new Types.ObjectId(merchantId);
    const tableKey = waiterCallTableKey(resolvedTableName);

    const activeCalls = await WaiterCall.find({
      merchantId: merchantOid,
      type: "waiter_call",
      status: { $in: ACTIVE_WAITER_CALL_STATUSES },
    }).lean();

    const ids = activeCalls
      .filter((call) => waiterCallTableKey(call.tableName) === tableKey)
      .map((call) => call._id);

    if (ids.length === 0) {
      return sendRJResponse({
        success: true,
        message: "No active waiter call",
        data: { modifiedCount: 0 },
        status: 200,
      });
    }

    const result = await WaiterCall.updateMany(
      { _id: { $in: ids } },
      { status }
    );

    return sendRJResponse({
      success: true,
      message: "Waiter call updated",
      data: { modifiedCount: result.modifiedCount },
      status: 200,
    });
  } catch (error) {
    console.error("Error updating waiter call:", error);
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
      status: { $in: ACTIVE_WAITER_CALL_STATUSES },
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
