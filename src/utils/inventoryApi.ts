import { resolveMerchantId } from "@/middleware/auth";
import type { IInventoryItem } from "@/model/inventoryItem";
import type { InventoryItemRow } from "@/types/inventory";
import { getInventoryStockStatus } from "@/utils/inventoryUnits";
import { NextRequest } from "next/server";
import { Types } from "mongoose";

export async function requireInventoryMerchantId(req: NextRequest) {
  return resolveMerchantId(req);
}

export function serializeInventoryItem(item: IInventoryItem): InventoryItemRow {
  const currentStock = item.currentStock;
  const minimumStock = item.minimumStock;
  return {
    _id: String(item._id),
    name: item.name,
    category: item.category,
    unit: item.unit,
    currentStock,
    minimumStock,
    unitCost: item.unitCost,
    totalValue: currentStock * item.unitCost,
    image: item.image,
    notes: item.notes,
    status: getInventoryStockStatus(currentStock, minimumStock),
  };
}

export function parsePositiveNumber(
  value: unknown,
  fallback?: number
): number | null {
  if (value === undefined || value === null || value === "") {
    return fallback ?? null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function toObjectId(id: string): Types.ObjectId | null {
  return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;
}
