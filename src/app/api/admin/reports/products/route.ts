import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Menu } from "@/model/menu";
import { Order } from "@/model/order";
import { Refund } from "@/model/refund";
import { sendRJResponse } from "@/utils/api";
import { completedOrdersMatch, refundsMatch } from "@/utils/reports/aggregations";
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
      params.get("preset") || "last7",
      params.get("from"),
      params.get("to")
    );
    const category = (params.get("category") || "all").trim();
    const page = Math.max(1, Number(params.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(params.get("limit") || 20)));

    const orderMatch = completedOrdersMatch(merchantId, range);
    const refundMatch = refundsMatch(merchantId, range);

    const [categories, itemAgg, refundAgg] = await Promise.all([
      Menu.distinct("section", { merchantId }),
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
        { $unwind: { path: "$menu", preserveNullAndEmptyArrays: true } },
        ...(category !== "all"
          ? [{ $match: { "menu.section": category } }]
          : []),
        {
          $group: {
            _id: {
              title: "$items.title",
              section: { $ifNull: ["$menu.section", "Бусад"] },
            },
            quantitySold: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
          },
        },
        { $sort: { quantitySold: -1 } },
      ]),
      Refund.aggregate([
        { $match: refundMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.title",
            refundQuantity: { $sum: "$items.quantity" },
            refundAmount: { $sum: "$items.amount" },
          },
        },
      ]),
    ]);

    const refundByTitle = new Map(
      refundAgg.map((row: { _id: string; refundQuantity: number; refundAmount: number }) => [
        row._id,
        { qty: row.refundQuantity, amount: row.refundAmount },
      ])
    );

    const products = itemAgg.map(
      (row: {
        _id: { title: string; section: string };
        quantitySold: number;
        revenue: number;
      }) => {
        const refund = refundByTitle.get(row._id.title);
        const refundQuantity = refund?.qty ?? 0;
        const refundAmount = refund?.amount ?? 0;
        const netRevenue = row.revenue - refundAmount;
        return {
          productName: row._id.title,
          category: row._id.section,
          quantitySold: row.quantitySold,
          revenue: row.revenue,
          averagePrice:
            row.quantitySold > 0
              ? Math.round(row.revenue / row.quantitySold)
              : 0,
          refundQuantity,
          netRevenue,
        };
      }
    );

    const totalProductsSold = products.reduce(
      (sum, row) => sum + row.quantitySold,
      0
    );
    const totalProductRevenue = products.reduce(
      (sum, row) => sum + row.revenue,
      0
    );
    const bestProduct = products[0]?.productName ?? null;

    const categoryMap = new Map<string, number>();
    for (const row of products) {
      categoryMap.set(
        row.category,
        (categoryMap.get(row.category) ?? 0) + row.revenue
      );
    }
    const categoryRevenue = [...categoryMap.entries()]
      .map(([label, revenue]) => ({
        key: label,
        label,
        revenue,
        orders: products
          .filter((p) => p.category === label)
          .reduce((s, p) => s + p.quantitySold, 0),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const bestCategory = categoryRevenue[0]?.label ?? null;
    const total = products.length;
    const paged = products.slice((page - 1) * limit, page * limit);

    const topByQuantity = [...products]
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10)
      .map((row) => ({
        label: row.productName,
        quantity: row.quantitySold,
        revenue: row.revenue,
      }));

    const topByRevenue = [...products]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((row) => ({
        label: row.productName,
        quantity: row.quantitySold,
        revenue: row.revenue,
      }));

    return sendRJResponse({
      success: true,
      message: "Product sales report fetched",
      data: {
        range: {
          label: range.label,
          from: range.start.toISOString(),
          to: range.end.toISOString(),
        },
        categories: categories.filter(Boolean).sort(),
        metrics: {
          totalProductsSold,
          totalProductRevenue,
          bestProduct,
          bestCategory,
        },
        topByQuantity,
        topByRevenue,
        categoryRevenue,
        products: paged,
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
    console.error("Product sales report error:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
