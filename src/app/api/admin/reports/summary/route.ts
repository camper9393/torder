import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Order } from "@/model/order";
import { Refund } from "@/model/refund";
import { sendRJResponse } from "@/utils/api";
import {
  completedOrdersMatch,
  GROSS_SALES_EXPR,
  isDrinkSection,
  refundsMatch,
  reportDateToString,
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

    const [orderFacet, refundAgg, itemStats, tableStats] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        {
          $facet: {
            metrics: [
              {
                $group: {
                  _id: null,
                  grossSales: { $sum: GROSS_SALES_EXPR },
                  orderCount: { $sum: 1 },
                  activeTables: { $addToSet: "$tableName" },
                },
              },
            ],
            revenueTrend: [
              {
                $group: {
                  _id: reportDateToString("$updatedAt"),
                  revenue: { $sum: GROSS_SALES_EXPR },
                  orders: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]),
      Refund.aggregate([
        { $match: refundMatch },
        { $group: { _id: null, refunds: { $sum: "$refundAmount" } } },
      ]),
      Order.aggregate([
        { $match: orderMatch },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "menus",
            localField: "items.menuItemId",
            foreignField: "_id",
            as: "menu",
          },
        },
        {
          $unwind: { path: "$menu", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: {
              title: "$items.title",
              section: { $ifNull: ["$menu.section", "Бусад"] },
            },
            quantity: { $sum: "$items.quantity" },
            revenue: {
              $sum: {
                $multiply: ["$items.price", "$items.quantity"],
              },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 100 },
      ]),
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: "$tableName",
            orders: { $sum: 1 },
            revenue: { $sum: GROSS_SALES_EXPR },
          },
        },
        { $sort: { orders: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const facet = orderFacet[0] ?? {};
    const metricsRow = facet.metrics?.[0];
    const grossSales = metricsRow?.grossSales ?? 0;
    const orderCount = metricsRow?.orderCount ?? 0;
    const activeTables = metricsRow?.activeTables?.length ?? 0;
    const refunds = refundAgg[0]?.refunds ?? 0;
    const netSales = grossSales - refunds;

    const sectionMap = new Map<
      string,
      { revenue: number; orders: number }
    >();
    const products: {
      title: string;
      section: string;
      quantity: number;
      revenue: number;
    }[] = [];

    for (const row of itemStats) {
      const title = row._id.title as string;
      const section = row._id.section as string;
      const quantity = row.quantity as number;
      const revenue = row.revenue as number;
      products.push({ title, section, quantity, revenue });

      const prev = sectionMap.get(section) ?? { revenue: 0, orders: 0 };
      prev.revenue += revenue;
      prev.orders += quantity;
      sectionMap.set(section, prev);
    }

    const topCategories = [...sectionMap.entries()]
      .map(([section, data]) => ({
        key: section,
        label: section,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const salesDistribution = topCategories.map((row) => ({
      name: row.label,
      value: row.revenue,
    }));

    const foodProducts = products.filter((p) => !isDrinkSection(p.section));
    const drinkProducts = products.filter((p) => isDrinkSection(p.section));

    const bestProduct = foodProducts[0] ?? products[0] ?? null;
    const bestDrink = drinkProducts[0] ?? null;
    const topTable = tableStats[0];

    return sendRJResponse({
      success: true,
      message: "Summary report fetched",
      data: {
        range: {
          label: range.label,
          from: range.start.toISOString(),
          to: range.end.toISOString(),
        },
        metrics: {
          grossSales,
          netSales,
          refunds,
          averageTicket:
            orderCount > 0 ? Math.round(grossSales / orderCount) : 0,
          tableTurnoverRate:
            activeTables > 0
              ? Math.round((orderCount / activeTables) * 100) / 100
              : 0,
          orderCount,
          activeTables,
        },
        revenueTrend: (facet.revenueTrend ?? []).map(
          (row: { _id: string; revenue: number; orders: number }) => ({
            label: row._id,
            revenue: row.revenue,
            orders: row.orders,
          })
        ),
        topCategories,
        salesDistribution,
        widgets: {
          bestProduct: bestProduct
            ? {
                title: "Шилдэг бүтээгдэхүүн",
                name: bestProduct.title,
                quantity: bestProduct.quantity,
                revenue: bestProduct.revenue,
              }
            : null,
          bestDrink: bestDrink
            ? {
                title: "Шилдэг уух зүйл",
                name: bestDrink.title,
                quantity: bestDrink.quantity,
                revenue: bestDrink.revenue,
              }
            : null,
          mostActiveTable: topTable
            ? {
                title: "Идэвхтэй ширээ",
                name: topTable._id as string,
                quantity: topTable.orders as number,
                revenue: topTable.revenue as number,
              }
            : null,
        },
      },
      status: 200,
    });
  } catch (error) {
    console.error("Summary report error:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
