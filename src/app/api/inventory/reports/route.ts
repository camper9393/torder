import mongoServer from "@/config/mongoConfig";
import { InventoryItem } from "@/model/inventoryItem";
import { InventoryTransaction } from "@/model/inventoryTransaction";
import { sendRJResponse } from "@/utils/api";
import {
  endOfDay,
  requireInventoryMerchantId,
  startOfDay,
} from "@/utils/inventoryApi";
import { NextRequest } from "next/server";

function buildLast7Days(): { date: string; label: string }[] {
  const days: { date: string; label: string }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      date: startOfDay(d).toISOString().slice(0, 10),
      label: d.toLocaleDateString("mn-MN", { weekday: "short" }),
    });
  }
  return days;
}

export async function GET(req: NextRequest) {
  try {
    await mongoServer();
    const merchantId = await requireInventoryMerchantId(req);
    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const weekStart = startOfDay(new Date());
    weekStart.setDate(weekStart.getDate() - 6);

    const [
      items,
      todayUsageAgg,
      weeklyUsageAgg,
      dailyUsage,
      topIngredients,
    ] = await Promise.all([
      InventoryItem.find({ merchantId })
        .select("currentStock unitCost category")
        .lean(),
      InventoryTransaction.aggregate([
        {
          $match: {
            merchantId,
            type: "usage",
            createdAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            cost: {
              $sum: {
                $multiply: [
                  { $abs: "$quantity" },
                  { $ifNull: ["$unitCost", 0] },
                ],
              },
            },
          },
        },
      ]),
      InventoryTransaction.aggregate([
        {
          $match: {
            merchantId,
            type: "usage",
            createdAt: { $gte: weekStart, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            cost: {
              $sum: {
                $multiply: [
                  { $abs: "$quantity" },
                  { $ifNull: ["$unitCost", 0] },
                ],
              },
            },
          },
        },
      ]),
      InventoryTransaction.aggregate([
        {
          $match: {
            merchantId,
            type: "usage",
            createdAt: { $gte: weekStart, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            cost: {
              $sum: {
                $multiply: [
                  { $abs: "$quantity" },
                  { $ifNull: ["$unitCost", 0] },
                ],
              },
            },
          },
        },
      ]),
      InventoryTransaction.aggregate([
        {
          $match: {
            merchantId,
            type: "usage",
            createdAt: { $gte: weekStart, $lte: todayEnd },
          },
        },
        {
          $lookup: {
            from: "inventory_items",
            localField: "inventoryItemId",
            foreignField: "_id",
            as: "item",
          },
        },
        { $unwind: "$item" },
        {
          $group: {
            _id: "$inventoryItemId",
            name: { $first: "$item.name" },
            unit: { $first: "$unit" },
            quantity: { $sum: { $abs: "$quantity" } },
            cost: {
              $sum: {
                $multiply: [
                  { $abs: "$quantity" },
                  { $ifNull: ["$unitCost", 0] },
                ],
              },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const inventoryValue = items.reduce(
      (sum, item) => sum + item.currentStock * item.unitCost,
      0
    );

    const categoryMap = new Map<string, number>();
    for (const item of items) {
      const value = item.currentStock * item.unitCost;
      categoryMap.set(
        item.category,
        (categoryMap.get(item.category) ?? 0) + value
      );
    }

    const usageByDate = new Map(
      dailyUsage.map((row: { _id: string; cost: number }) => [
        row._id,
        row.cost,
      ])
    );

    const dailyConsumption = buildLast7Days().map(({ date, label }) => ({
      date,
      label,
      cost: usageByDate.get(date) ?? 0,
    }));

    const categoryConsumption = [...categoryMap.entries()]
      .map(([category, cost]) => ({ category, cost }))
      .sort((a, b) => b.cost - a.cost);

    return sendRJResponse({
      success: true,
      message: "Inventory reports fetched",
      data: {
        todayUsage: todayUsageAgg[0]?.cost ?? 0,
        weeklyUsage: weeklyUsageAgg[0]?.cost ?? 0,
        inventoryValue,
        dailyConsumption,
        categoryConsumption,
        topUsedIngredients: topIngredients.map(
          (row: {
            name: string;
            quantity: number;
            unit: string;
            cost: number;
          }) => ({
            name: row.name,
            quantity: row.quantity,
            unit: row.unit,
            cost: row.cost,
          })
        ),
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching inventory reports:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
