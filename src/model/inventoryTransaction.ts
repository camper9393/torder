import mongoose from "mongoose";
import type { InventoryUnit } from "@/model/inventoryItem";

export type InventoryTransactionType =
  | "stock_in"
  | "usage"
  | "manual_adjustment"
  | "refund_return";

export interface IInventoryTransaction {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  inventoryItemId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  type: InventoryTransactionType;
  quantity: number;
  unit: InventoryUnit;
  unitCost?: number;
  remainingStock: number;
  supplier?: string;
  purchaseDate?: Date;
  notes?: string;
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryTransactionSchema = new mongoose.Schema<IInventoryTransaction>(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchants",
      required: true,
      index: true,
    },
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "inventory_items",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
      index: true,
    },
    type: {
      type: String,
      enum: ["stock_in", "usage", "manual_adjustment", "refund_return"],
      required: true,
    },
    quantity: { type: Number, required: true },
    unit: {
      type: String,
      enum: ["kg", "gram", "liter", "piece"],
      required: true,
    },
    unitCost: { type: Number, min: 0 },
    remainingStock: { type: Number, required: true, min: 0 },
    supplier: { type: String, trim: true },
    purchaseDate: { type: Date },
    notes: { type: String, trim: true, maxlength: 1000 },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchants",
    },
    userName: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false }
);

inventoryTransactionSchema.index({ merchantId: 1, createdAt: -1 });
inventoryTransactionSchema.index({ merchantId: 1, type: 1, createdAt: -1 });
inventoryTransactionSchema.index({ merchantId: 1, orderId: 1, type: 1 });

const INVENTORY_TRANSACTION_MODEL = "inventory_transactions";

if (mongoose.models[INVENTORY_TRANSACTION_MODEL]) {
  const typePath = mongoose.models[INVENTORY_TRANSACTION_MODEL].schema.path("type");
  const enumValues = (typePath as { enumValues?: string[] } | undefined)
    ?.enumValues;
  if (!enumValues?.includes("refund_return")) {
    mongoose.deleteModel(INVENTORY_TRANSACTION_MODEL);
  }
}

export const InventoryTransaction =
  mongoose.models[INVENTORY_TRANSACTION_MODEL] ||
  mongoose.model<IInventoryTransaction>(
    INVENTORY_TRANSACTION_MODEL,
    inventoryTransactionSchema
  );
