import mongoServer from "@/config/mongoConfig";
import { InventoryTransaction } from "@/model/inventoryTransaction";
import { sendRJResponse } from "@/utils/api";
import { requireInventoryMerchantId } from "@/utils/inventoryApi";
import type { InventoryTransactionType } from "@/model/inventoryTransaction";
import { NextRequest } from "next/server";
import { Types, type PipelineStage } from "mongoose";

const TYPES: InventoryTransactionType[] = [
  "stock_in",
  "usage",
  "manual_adjustment",
  "refund_return",
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    const params = req.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 20)));
    const search = (params.get("search") || "").trim();
    const type = params.get("type") || "all";

    const match: Record<string, unknown> = { merchantId };
    if (type !== "all" && TYPES.includes(type as InventoryTransactionType)) {
      match.type = type;
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: "inventory_items",
          localField: "inventoryItemId",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },
    ];

    if (search) {
      pipeline.push({
        $match: {
          "item.name": { $regex: escapeRegex(search), $options: "i" },
        },
      });
    }

    const countPipeline: PipelineStage[] = [...pipeline, { $count: "total" }];
    const dataPipeline: PipelineStage[] = [
      ...pipeline,
      { $sort: { createdAt: -1 as const } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          type: 1,
          quantity: 1,
          unit: 1,
          remainingStock: 1,
          userName: 1,
          notes: 1,
          itemId: "$item._id",
          itemName: "$item.name",
        },
      },
    ];

    const [countResult, rows] = await Promise.all([
      InventoryTransaction.aggregate(countPipeline),
      InventoryTransaction.aggregate(dataPipeline),
    ]);

    const total = countResult[0]?.total ?? 0;

    return sendRJResponse({
      success: true,
      message: "Transactions fetched",
      data: {
        transactions: rows.map(
          (row: {
            _id: Types.ObjectId;
            createdAt: Date;
            itemName: string;
            itemId: Types.ObjectId;
            type: InventoryTransactionType;
            quantity: number;
            unit: string;
            remainingStock: number;
            userName?: string;
            notes?: string;
          }) => ({
            _id: String(row._id),
            createdAt: row.createdAt.toISOString(),
            itemName: row.itemName,
            itemId: String(row.itemId),
            type: row.type,
            quantity: row.quantity,
            unit: row.unit,
            remainingStock: row.remainingStock,
            userName: row.userName || "—",
            notes: row.notes,
          })
        ),
        total,
        page,
        limit,
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching inventory transactions:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
