import mongoose from "mongoose";

export type InventoryUnit = "kg" | "gram" | "liter" | "piece";

export interface IInventoryItem {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
  image?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new mongoose.Schema<IInventoryItem>(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchants",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    unit: {
      type: String,
      enum: ["kg", "gram", "liter", "piece"],
      required: true,
    },
    currentStock: { type: Number, required: true, min: 0, default: 0 },
    minimumStock: { type: Number, required: true, min: 0, default: 0 },
    unitCost: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true, versionKey: false }
);

inventoryItemSchema.index({ merchantId: 1, name: 1 });
inventoryItemSchema.index({ merchantId: 1, category: 1 });
inventoryItemSchema.index({ merchantId: 1, currentStock: 1 });

export const InventoryItem =
  mongoose.models.inventory_items ||
  mongoose.model<IInventoryItem>("inventory_items", inventoryItemSchema);
