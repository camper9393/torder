import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Refund } from "@/model/refund";
import { sendRJResponse } from "@/utils/api";
import {
  processRefund,
  RefundValidationError,
} from "@/utils/refundService";
import type { CreateRefundPayload } from "@/types/refund";
import { NextRequest } from "next/server";

function serializeRefund(doc: {
  _id: unknown;
  orderId: unknown;
  tableName: string;
  items: unknown[];
  refundAmount: number;
  reason: string;
  refundType: string;
  paymentMethod: string;
  createdByName?: string;
  createdAt: Date;
}) {
  return {
    _id: String(doc._id),
    orderId: String(doc.orderId),
    tableName: doc.tableName,
    items: doc.items,
    refundAmount: doc.refundAmount,
    reason: doc.reason,
    refundType: doc.refundType,
    paymentMethod: doc.paymentMethod,
    createdByName: doc.createdByName,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    await mongoServer();
    const merchantId = await resolveMerchantId(req);
    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const params = req.nextUrl.searchParams;
    const orderId = params.get("orderId");
    const from = params.get("from");
    const to = params.get("to");
    const limit = Math.min(Math.max(Number(params.get("limit") || 100), 1), 500);

    const query: Record<string, unknown> = { merchantId };

    if (orderId) {
      query.orderId = orderId;
    }

    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) createdAt.$gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          createdAt.$lte = d;
        }
      }
      if (Object.keys(createdAt).length) query.createdAt = createdAt;
    }

    const refunds = await Refund.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const totalAmount = refunds.reduce((sum, row) => sum + row.refundAmount, 0);

    return sendRJResponse({
      success: true,
      message: "Refunds fetched",
      data: {
        refunds: refunds.map(serializeRefund),
        totalAmount,
        count: refunds.length,
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await mongoServer();
    const merchantId = await resolveMerchantId(req);
    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const body = (await req.json()) as CreateRefundPayload;

    const result = await processRefund(merchantId, merchantId, body);

    return sendRJResponse({
      success: true,
      message: "Буцаалт амжилттай",
      data: result,
      status: 201,
    });
  } catch (error) {
    if (error instanceof RefundValidationError) {
      return sendRJResponse({
        success: false,
        message: error.message,
        status: 400,
      });
    }
    console.error("Error processing refund:", error);
    return sendRJResponse({
      success: false,
      message: "Буцаалт хийхэд алдаа гарлаа",
      status: 500,
    });
  }
}
