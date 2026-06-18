import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Order } from "@/model/order";
import { Refund, type RefundReason } from "@/model/refund";
import { sendRJResponse } from "@/utils/api";
import { refundsMatch, reportDateToString } from "@/utils/reports/aggregations";
import {
  resolveReportDateRange,
  validateCustomReportRange,
} from "@/utils/reports/dateRange";
import { REFUND_REASON_LABELS } from "@/types/refund";
import { formatOrderNumber } from "@/utils/serializeKitchenOrder";
import { NextRequest } from "next/server";

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
    const page = Math.max(1, Number(params.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 20)));
    const reason = (params.get("reason") || "").trim();
    const rangeError = validateCustomReportRange(
      params.get("preset"),
      params.get("from"),
      params.get("to")
    );
    if (rangeError) {
      return sendRJResponse({
        success: false,
        message: rangeError,
        status: 400,
      });
    }
    const range = resolveReportDateRange(
      params.get("preset") || "last30",
      params.get("from"),
      params.get("to")
    );

    const match: Record<string, unknown> = refundsMatch(merchantId, range);
    if (reason && reason !== "all") {
      match.reason = reason;
    }

    const [facet] = await Refund.aggregate([
      { $match: match },
      {
        $facet: {
          metrics: [
            {
              $group: {
                _id: null,
                refundCount: { $sum: 1 },
                refundAmount: { $sum: "$refundAmount" },
              },
            },
          ],
          trend: [
            {
              $group: {
                _id: reportDateToString("$createdAt"),
                revenue: { $sum: "$refundAmount" },
                orders: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          reasons: [
            {
              $group: {
                _id: "$reason",
                count: { $sum: 1 },
                amount: { $sum: "$refundAmount" },
              },
            },
            { $sort: { amount: -1 } },
          ],
          total: [{ $count: "count" }],
          rows: [
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
        },
      },
    ]);

    const metricsRow = facet?.metrics?.[0];
    const total = facet?.total?.[0]?.count ?? 0;
    const refundRows = facet?.rows ?? [];

    const orderIds = refundRows
      .map((doc: { orderId: unknown }) => doc.orderId)
      .filter(Boolean);
    const orderDocs = orderIds.length
      ? await Order.find({ _id: { $in: orderIds } })
          .select("_id orderNo")
          .lean()
      : [];
    const orderNoById = new Map(
      orderDocs.map((doc) => [String(doc._id), doc.orderNo ?? ""])
    );

    const refunds = refundRows.map(
      (doc: {
        _id: unknown;
        orderId: unknown;
        tableName: string;
        refundAmount: number;
        reason: RefundReason;
        createdAt: Date;
        createdByName?: string;
      }) => {
        const created = new Date(doc.createdAt);
        return {
          _id: String(doc._id),
          orderId: String(doc.orderId),
          orderNumber: formatOrderNumber({
            _id: String(doc.orderId),
            orderNo: orderNoById.get(String(doc.orderId)) || undefined,
          }),
          tableName: doc.tableName,
          refundAmount: doc.refundAmount,
          reason: doc.reason,
          reasonLabel: REFUND_REASON_LABELS[doc.reason] ?? doc.reason,
          date: created.toISOString().slice(0, 10),
          time: created.toLocaleTimeString("mn-MN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          userName: doc.createdByName || "—",
        };
      }
    );

    return sendRJResponse({
      success: true,
      message: "Refunds report fetched",
      data: {
        metrics: {
          refundCount: metricsRow?.refundCount ?? 0,
          refundAmount: metricsRow?.refundAmount ?? 0,
        },
        refunds,
        trend: (facet?.trend ?? []).map(
          (row: { _id: string; revenue: number; orders: number }) => ({
            label: row._id,
            revenue: row.revenue,
            orders: row.orders,
          })
        ),
        reasons: (facet?.reasons ?? []).map(
          (row: { _id: RefundReason; count: number; amount: number }) => ({
            reason: row._id,
            label: REFUND_REASON_LABELS[row._id] ?? row._id,
            count: row.count,
            amount: row.amount,
          })
        ),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      status: 200,
    });
  } catch (error) {
    console.error("Refunds report error:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
