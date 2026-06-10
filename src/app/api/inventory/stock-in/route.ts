import mongoServer from "@/config/mongoConfig";
import { InventoryItem } from "@/model/inventoryItem";
import { InventoryTransaction } from "@/model/inventoryTransaction";
import { Merchants } from "@/model/merchants";
import { sendRJResponse } from "@/utils/api";
import {
  parsePositiveNumber,
  requireInventoryMerchantId,
  toObjectId,
} from "@/utils/inventoryApi";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const itemId = toObjectId(String(body.inventoryItemId || ""));
    const quantity = parsePositiveNumber(body.quantity);
    const unitCost = parsePositiveNumber(body.unitCost);
    const supplier = String(body.supplier || "").trim();
    const notes = String(body.notes || "").trim();
    const purchaseDateRaw = body.purchaseDate;

    if (!itemId || quantity === null || quantity <= 0) {
      return sendRJResponse({
        success: false,
        message: "Бараа болон тоо хэмжээ заавал",
        status: 400,
      });
    }

    const item = await InventoryItem.findOne({ _id: itemId, merchantId });
    if (!item) {
      return sendRJResponse({
        success: false,
        message: "Бараа олдсонгүй",
        status: 404,
      });
    }

    const newStock = item.currentStock + quantity;
    item.currentStock = newStock;
    if (unitCost !== null && unitCost > 0) {
      item.unitCost = unitCost;
    }
    await item.save();

    const merchant = await Merchants.findById(merchantId).select("name").lean();
    const purchaseDate = purchaseDateRaw
      ? new Date(purchaseDateRaw)
      : new Date();

    const transaction = await InventoryTransaction.create({
      merchantId,
      inventoryItemId: item._id,
      type: "stock_in",
      quantity,
      unit: item.unit,
      unitCost: unitCost ?? item.unitCost,
      remainingStock: newStock,
      supplier: supplier || undefined,
      purchaseDate: Number.isNaN(purchaseDate.getTime())
        ? new Date()
        : purchaseDate,
      notes: notes || undefined,
      userId: merchantId,
      userName: merchant?.name || "Ажилтан",
    });

    return sendRJResponse({
      success: true,
      message: "Орлого бүртгэгдлээ",
      data: {
        transactionId: String(transaction._id),
        remainingStock: newStock,
      },
      status: 201,
    });
  } catch (error) {
    console.error("Error recording stock in:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
