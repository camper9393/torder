import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Order } from "@/model/order";
import { Refund } from "@/model/refund";
import { sendRJResponse } from "@/utils/api";
import {
  completedOrdersMatch,
  GROSS_SALES_EXPR,
  hourLabel,
  refundsMatch,
  reportDateToString,
  reportHourOfDay,
  weekLabel,
} from "@/utils/reports/aggregations";
import {
  resolveReportDateRange,
  validateCustomReportRange,
} from "@/utils/reports/dateRange";
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
      params.get("preset"),
      params.get("from"),
      params.get("to")
    );

    const orderMatch = completedOrdersMatch(merchantId, range);
    const refundMatch = refundsMatch(merchantId, range);

    const [orderFacet, refundAgg] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        {
          $facet: {
            metrics: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  totalSales: { $sum: GROSS_SALES_EXPR },
                },
              },
            ],
            dailySales: [
              {
                $group: {
                  _id: reportDateToString("$updatedAt"),
                  revenue: { $sum: GROSS_SALES_EXPR },
                  orders: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
            hourlySales: [
              {
                $group: {
                  _id: reportHourOfDay("$updatedAt"),
                  revenue: { $sum: GROSS_SALES_EXPR },
                  orders: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
            weeklyTrend: [
              {
                $group: {
                  _id: {
                    year: { $isoWeekYear: "$updatedAt" },
                    week: { $isoWeek: "$updatedAt" },
                  },
                  revenue: { $sum: GROSS_SALES_EXPR },
                  orders: { $sum: 1 },
                },
              },
              { $sort: { "_id.year": 1, "_id.week": 1 } },
            ],
            salesByTable: [
              {
                $group: {
                  _id: "$tableName",
                  revenue: { $sum: GROSS_SALES_EXPR },
                  orders: { $sum: 1 },
                },
              },
              { $sort: { revenue: -1 } },
              { $limit: 50 },
            ],
          },
        },
      ]),
      Refund.aggregate([
        { $match: refundMatch },
        {
          $group: {
            _id: null,
            refundAmount: { $sum: "$refundAmount" },
          },
        },
      ]),
    ]);

    const facet = orderFacet[0] ?? {};
    const metricsRow = facet.metrics?.[0];
    const totalSales = metricsRow?.totalSales ?? 0;
    const totalOrders = metricsRow?.totalOrders ?? 0;
    const refundAmount = refundAgg[0]?.refundAmount ?? 0;

    return sendRJResponse({
      success: true,
      message: "Sales report fetched",
      data: {
        range: {
          preset: range.preset,
          label: range.label,
          from: range.start.toISOString(),
          to: range.end.toISOString(),
        },
        metrics: {
          totalSales,
          totalOrders,
          averageOrderValue:
            totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
          refundAmount,
          netRevenue: totalSales - refundAmount,
        },
        dailySales: (facet.dailySales ?? []).map(
          (row: { _id: string; revenue: number; orders: number }) => ({
            label: row._id,
            revenue: row.revenue,
            orders: row.orders,
          })
        ),
        hourlySales: (facet.hourlySales ?? []).map(
          (row: { _id: number; revenue: number; orders: number }) => ({
            label: hourLabel(row._id),
            revenue: row.revenue,
            orders: row.orders,
          })
        ),
        weeklyTrend: (facet.weeklyTrend ?? []).map(
          (row: {
            _id: { year: number; week: number };
            revenue: number;
            orders: number;
          }) => ({
            label: weekLabel(row._id.year, row._id.week),
            revenue: row.revenue,
            orders: row.orders,
          })
        ),
        salesByDate: (facet.dailySales ?? []).map(
          (row: { _id: string; revenue: number; orders: number }) => ({
            key: row._id,
            label: row._id,
            revenue: row.revenue,
            orders: row.orders,
          })
        ),
        salesByTable: (facet.salesByTable ?? []).map(
          (row: { _id: string; revenue: number; orders: number }) => ({
            key: row._id,
            label: row._id,
            revenue: row.revenue,
            orders: row.orders,
          })
        ),
      },
      status: 200,
    });
  } catch (error) {
    console.error("Sales report error:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
