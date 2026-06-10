import mongoServer from "@/config/mongoConfig";
import { InventoryItem } from "@/model/inventoryItem";
import { InventoryTransaction } from "@/model/inventoryTransaction";
import { sendRJResponse } from "@/utils/api";
import {
  endOfDay,
  requireInventoryMerchantId,
  startOfDay,
} from "@/utils/inventoryApi";
import { getInventoryAlerts } from "@/utils/inventoryDeduction";
import { NextRequest } from "next/server";

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

    const [items, usageAgg, alerts] = await Promise.all([
      InventoryItem.find({ merchantId })
        .select("currentStock minimumStock unitCost")
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
      getInventoryAlerts(merchantId, 20),
    ]);

    let lowStockItems = 0;
    let outOfStockItems = 0;
    let totalInventoryValue = 0;

    for (const item of items) {
      totalInventoryValue += item.currentStock * item.unitCost;
      if (item.currentStock <= 0) outOfStockItems += 1;
      else if (item.currentStock <= item.minimumStock) lowStockItems += 1;
    }

    return sendRJResponse({
      success: true,
      message: "Inventory dashboard fetched",
      data: {
        totalItems: items.length,
        lowStockItems,
        outOfStockItems,
        todayUsageCost: usageAgg[0]?.cost ?? 0,
        totalInventoryValue,
        alerts,
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching inventory dashboard:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
