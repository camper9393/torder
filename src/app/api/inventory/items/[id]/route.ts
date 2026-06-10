import mongoServer from "@/config/mongoConfig";
import { InventoryItem, type InventoryUnit } from "@/model/inventoryItem";
import { InventoryTransaction } from "@/model/inventoryTransaction";
import { uploadToCloudinary } from "@/service/cloudnary";
import { sendRJResponse } from "@/utils/api";
import {
  parsePositiveNumber,
  requireInventoryMerchantId,
  serializeInventoryItem,
  toObjectId,
} from "@/utils/inventoryApi";
import { Merchants } from "@/model/merchants";
import { NextRequest } from "next/server";

const UNITS: InventoryUnit[] = ["kg", "gram", "liter", "piece"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const objectId = toObjectId(id);
    if (!objectId) {
      return sendRJResponse({
        success: false,
        message: "Буруу ID",
        status: 400,
      });
    }

    const existing = await InventoryItem.findOne({
      _id: objectId,
      merchantId,
    });
    if (!existing) {
      return sendRJResponse({
        success: false,
        message: "Бараа олдсонгүй",
        status: 404,
      });
    }

    const contentType = req.headers.get("content-type") || "";
    let manualAdjustment: number | null = null;
    let adjustmentNotes: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const name = formData.get("name");
      const category = formData.get("category");
      const unit = formData.get("unit");
      const notes = formData.get("notes");
      const file = formData.get("image") as File | null;

      if (name !== null) existing.name = String(name).trim();
      if (category !== null) existing.category = String(category).trim();
      if (unit !== null && UNITS.includes(String(unit) as InventoryUnit)) {
        existing.unit = String(unit) as InventoryUnit;
      }
      if (notes !== null) existing.notes = String(notes).trim() || undefined;

      const currentStock = parsePositiveNumber(formData.get("currentStock"));
      const minimumStock = parsePositiveNumber(formData.get("minimumStock"));
      const unitCost = parsePositiveNumber(formData.get("unitCost"));

      if (currentStock !== null) {
        if (currentStock !== existing.currentStock) {
          manualAdjustment = currentStock - existing.currentStock;
        }
        existing.currentStock = currentStock;
      }
      if (minimumStock !== null) existing.minimumStock = minimumStock;
      if (unitCost !== null) existing.unitCost = unitCost;

      if (file && file.size > 0 && file.type.startsWith("image/")) {
        const buffer = Buffer.from(await file.arrayBuffer());
        existing.image = await uploadToCloudinary(
          buffer,
          `qr-menu/inventory/${merchantId}`
        );
      }
      adjustmentNotes = String(formData.get("adjustmentNotes") || "").trim() || undefined;
    } else {
      const body = await req.json();
      if (body.name !== undefined) existing.name = String(body.name).trim();
      if (body.category !== undefined) {
        existing.category = String(body.category).trim();
      }
      if (body.unit !== undefined && UNITS.includes(body.unit)) {
        existing.unit = body.unit;
      }
      if (body.notes !== undefined) {
        existing.notes = String(body.notes).trim() || undefined;
      }
      if (body.minimumStock !== undefined) {
        const min = parsePositiveNumber(body.minimumStock);
        if (min !== null) existing.minimumStock = min;
      }
      if (body.unitCost !== undefined) {
        const cost = parsePositiveNumber(body.unitCost);
        if (cost !== null) existing.unitCost = cost;
      }
      if (body.currentStock !== undefined) {
        const stock = parsePositiveNumber(body.currentStock);
        if (stock !== null) {
          if (stock !== existing.currentStock) {
            manualAdjustment = stock - existing.currentStock;
          }
          existing.currentStock = stock;
        }
      }
      adjustmentNotes = body.adjustmentNotes
        ? String(body.adjustmentNotes).trim()
        : undefined;
    }

    await existing.save();

    if (manualAdjustment !== null && manualAdjustment !== 0) {
      const merchant = await Merchants.findById(merchantId).select("name").lean();
      await InventoryTransaction.create({
        merchantId,
        inventoryItemId: existing._id,
        type: "manual_adjustment",
        quantity: manualAdjustment,
        unit: existing.unit,
        unitCost: existing.unitCost,
        remainingStock: existing.currentStock,
        userId: merchantId,
        userName: merchant?.name || "Ажилтан",
        notes: adjustmentNotes || "Гараар тохируулсан",
      });
    }

    return sendRJResponse({
      success: true,
      message: "Бараа шинэчлэгдлээ",
      data: serializeInventoryItem(existing.toObject()),
      status: 200,
    });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const objectId = toObjectId(id);
    if (!objectId) {
      return sendRJResponse({
        success: false,
        message: "Буруу ID",
        status: 400,
      });
    }

    const deleted = await InventoryItem.findOneAndDelete({
      _id: objectId,
      merchantId,
    });

    if (!deleted) {
      return sendRJResponse({
        success: false,
        message: "Бараа олдсонгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Бараа устгагдлаа",
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
