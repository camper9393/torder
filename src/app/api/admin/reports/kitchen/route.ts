import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Order } from "@/model/order";
import { sendRJResponse } from "@/utils/api";
import {
  completedOrdersMatch,
  hourLabel,
  reportDateToString,
  reportHourOfDay,
} from "@/utils/reports/aggregations";
import {
  resolveReportDateRange,
  validateCustomReportRange,
} from "@/utils/reports/dateRange";
import { NextRequest } from "next/server";

function msToMinutes(ms: number | null | undefined): number | null {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) {
    return null;
  }
  return Math.round(ms / 60000);
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
    const page = Math.max(1, Number(params.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(params.get("limit") || 20)));

    const orderMatch = completedOrdersMatch(merchantId, range);

    const [facet] = await Order.aggregate([
      { $match: orderMatch },
      {
        $facet: {
          metrics: [
            {
              $group: {
                _id: null,
                totalCookedOrders: { $sum: 1 },
                totalCookedItems: { $sum: { $size: "$items" } },
                avgPrepMs: {
                  $avg: { $subtract: ["$updatedAt", "$createdAt"] },
                },
                minPrepMs: {
                  $min: { $subtract: ["$updatedAt", "$createdAt"] },
                },
                maxPrepMs: {
                  $max: { $subtract: ["$updatedAt", "$createdAt"] },
                },
                itemQty: { $sum: { $sum: "$items.quantity" } },
              },
            },
          ],
          hourly: [
            {
              $group: {
                _id: reportHourOfDay("$updatedAt"),
                orders: { $sum: 1 },
                items: { $sum: { $sum: "$items.quantity" } },
              },
            },
            { $sort: { _id: 1 } },
          ],
          prepTrend: [
            {
              $group: {
                _id: reportDateToString("$updatedAt"),
                avgPrepMs: {
                  $avg: { $subtract: ["$updatedAt", "$createdAt"] },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          products: [
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.title",
                quantityCooked: { $sum: "$items.quantity" },
              },
            },
            { $sort: { quantityCooked: -1 } },
          ],
        },
      },
    ]);

    const metricsRow = facet?.metrics?.[0];
    const productStatsAll = (facet?.products ?? []).map(
      (row: { _id: string; quantityCooked: number }) => ({
        productName: row._id,
        quantityCooked: row.quantityCooked,
        averagePrepMinutes: null,
        fastestPrepMinutes: null,
        slowestPrepMinutes: null,
      })
    );

    const total = productStatsAll.length;
    const productStats = productStatsAll.slice(
      (page - 1) * limit,
      page * limit
    );

    return sendRJResponse({
      success: true,
      message: "Kitchen report fetched",
      data: {
        range: {
          label: range.label,
          from: range.start.toISOString(),
          to: range.end.toISOString(),
        },
        perItemPrepAvailable: false,
        metrics: {
          totalCookedOrders: metricsRow?.totalCookedOrders ?? 0,
          totalCookedItems: metricsRow?.itemQty ?? 0,
          averagePrepMinutes: msToMinutes(metricsRow?.avgPrepMs),
          fastestOrderPrepMinutes: msToMinutes(metricsRow?.minPrepMs),
          slowestOrderPrepMinutes: msToMinutes(metricsRow?.maxPrepMs),
        },
        productStats,
        hourlyWorkload: (facet?.hourly ?? []).map(
          (row: { _id: number; orders: number; items: number }) => ({
            label: hourLabel(row._id),
            revenue: row.items,
            orders: row.orders,
          })
        ),
        ordersPerHour: (facet?.hourly ?? []).map(
          (row: { _id: number; orders: number }) => ({
            label: hourLabel(row._id),
            revenue: row.orders,
            orders: row.orders,
          })
        ),
        prepTimeTrend: (facet?.prepTrend ?? []).map(
          (row: { _id: string; avgPrepMs: number }) => ({
            label: row._id,
            minutes: msToMinutes(row.avgPrepMs) ?? 0,
          })
        ),
        topCookedItems: productStatsAll.slice(0, 10).map((row: {
          productName: string;
          quantityCooked: number;
        }) => ({
          label: row.productName,
          quantity: row.quantityCooked,
        })),
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
    console.error("Kitchen report error:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
