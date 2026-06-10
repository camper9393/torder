import mongoose from "mongoose";
import type { InventoryUnit } from "@/model/inventoryItem";

export interface IRecipeIngredient {
  inventoryItemId: mongoose.Types.ObjectId;
  quantity: number;
  unit: InventoryUnit;
}

export interface IRecipe {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  menuItemId: mongoose.Types.ObjectId;
  ingredients: IRecipeIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

const recipeIngredientSchema = new mongoose.Schema<IRecipeIngredient>(
  {
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "inventory_items",
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      enum: ["kg", "gram", "liter", "piece"],
      required: true,
    },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema<IRecipe>(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchants",
      required: true,
      index: true,
    },
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "menus",
      required: true,
      index: true,
    },
    ingredients: { type: [recipeIngredientSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

recipeSchema.index({ merchantId: 1, menuItemId: 1 }, { unique: true });

export const Recipe =
  mongoose.models.recipes ||
  mongoose.model<IRecipe>("recipes", recipeSchema);
