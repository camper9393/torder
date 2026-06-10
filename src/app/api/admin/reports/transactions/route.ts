import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Order } from "@/model/order";
import { Refund } from "@/model/refund";
import { sendRJResponse } from "@/utils/api";
import {
  completedOrdersMatch,
  GROSS_SALES_EXPR,
  refundsMatch,
  reportDateToString,
} from "@/utils/reports/aggregations";
import {
  resolveReportDateRange,
  validateCustomReportRange,
} from "@/utils/reports/dateRange";
import {
  normalizePaymentMethod,
  PAYMENT_METHOD_LABELS,
  type PaymentMethodGroup,
} from "@/utils/reports/paymentMethod";
import { NextRequest } from "next/server";

type MethodBucket = {
  method: PaymentMethodGroup;
  count: number;
  gross: number;
  refunds: number;
};

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
      params.get("preset") || "last7",
      params.get("from"),
      params.get("to")
    );
    const methodFilter = (params.get("method") || "all").trim();
    const page = Math.max(1, Number(params.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(params.get("limit") || 20)));

    const orderMatch = completedOrdersMatch(merchantId, range);
    const refundMatch = refundsMatch(merchantId, range);

    const [orderRows, refundRows, dailyRows] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: {
              date: reportDateToString("$updatedAt"),
              paymentMethod: { $ifNull: ["$paymentMethod", "Бэлэн"] },
            },
            transactionCount: { $sum: 1 },
            grossAmount: { $sum: GROSS_SALES_EXPR },
          },
        },
        { $sort: { "_id.date": -1 } },
      ]),
      Refund.aggregate([
        { $match: refundMatch },
        {
          $group: {
            _id: {
              date: reportDateToString("$createdAt"),
              paymentMethod: { $ifNull: ["$paymentMethod", "Бэлэн"] },
            },
            refundAmount: { $sum: "$refundAmount" },
          },
        },
      ]),
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: reportDateToString("$updatedAt"),
            revenue: { $sum: GROSS_SALES_EXPR },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const refundKey = (date: string, method: string) =>
      `${date}::${normalizePaymentMethod(method)}`;

    const refundMap = new Map<string, number>();
    for (const row of refundRows) {
      refundMap.set(
        refundKey(row._id.date, row._id.paymentMethod),
        row.refundAmount
      );
    }

    const allRows = orderRows.map(
      (row: {
        _id: { date: string; paymentMethod: string };
        transactionCount: number;
        grossAmount: number;
      }) => {
        const methodKey = normalizePaymentMethod(row._id.paymentMethod);
        const refundAmount =
          refundMap.get(refundKey(row._id.date, row._id.paymentMethod)) ?? 0;
        return {
          date: row._id.date,
          paymentMethod: PAYMENT_METHOD_LABELS[methodKey],
          paymentMethodKey: methodKey,
          transactionCount: row.transactionCount,
          grossAmount: row.grossAmount,
          refundAmount,
          netAmount: row.grossAmount - refundAmount,
        };
      }
    );

    const filteredRows =
      methodFilter !== "all"
        ? allRows.filter((row) => row.paymentMethodKey === methodFilter)
        : allRows;

    const methodBuckets = new Map<PaymentMethodGroup, MethodBucket>();
    for (const row of allRows) {
      const key = row.paymentMethodKey as PaymentMethodGroup;
      const bucket = methodBuckets.get(key) ?? {
        method: key,
        count: 0,
        gross: 0,
        refunds: 0,
      };
      bucket.count += row.transactionCount;
      bucket.gross += row.grossAmount;
      bucket.refunds += row.refundAmount;
      methodBuckets.set(key, bucket);
    }

    const byMethod = [...methodBuckets.values()]
      .map((bucket) => ({
        method: PAYMENT_METHOD_LABELS[bucket.method],
        methodKey: bucket.method,
        count: bucket.count,
        gross: bucket.gross,
        refunds: bucket.refunds,
        net: bucket.gross - bucket.refunds,
      }))
      .sort((a, b) => b.gross - a.gross);

    const totalAmount = byMethod.reduce((s, row) => s + row.gross, 0);
    const totalCount = byMethod.reduce((s, row) => s + row.count, 0);
    const refundAmount = byMethod.reduce((s, row) => s + row.refunds, 0);
    const mostUsed = byMethod[0]?.method ?? null;

    const total = filteredRows.length;
    const paged = filteredRows.slice((page - 1) * limit, page * limit);

    return sendRJResponse({
      success: true,
      message: "Transaction report fetched",
      data: {
        range: {
          label: range.label,
          from: range.start.toISOString(),
          to: range.end.toISOString(),
        },
        metrics: {
          totalAmount,
          totalCount,
          mostUsedMethod: mostUsed,
          refundAmount,
          netAmount: totalAmount - refundAmount,
        },
        byMethod,
        dailyTrend: dailyRows.map(
          (row: { _id: string; revenue: number; orders: number }) => ({
            label: row._id,
            revenue: row.revenue,
            orders: row.orders,
          })
        ),
        rows: paged,
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
    console.error("Transaction report error:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
