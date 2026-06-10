import mongoServer from "@/config/mongoConfig";
import { Menu } from "@/model/menu";
import { InventoryItem, type InventoryUnit } from "@/model/inventoryItem";
import { Recipe } from "@/model/recipe";
import { sendRJResponse } from "@/utils/api";
import { requireInventoryMerchantId, toObjectId } from "@/utils/inventoryApi";
import { merchantMenuQuery } from "@/utils/menuMerchantScope";
import { NextRequest } from "next/server";

const UNITS: InventoryUnit[] = ["kg", "gram", "liter", "piece"];

type IngredientInput = {
  inventoryItemId: string;
  quantity: number;
  unit: InventoryUnit;
};

function parseIngredients(raw: unknown): IngredientInput[] | null {
  if (!Array.isArray(raw)) return null;
  const result: IngredientInput[] = [];
  for (const row of raw) {
    const inventoryItemId = String(row?.inventoryItemId || "");
    const quantity = Number(row?.quantity);
    const unit = String(row?.unit || "") as InventoryUnit;
    if (
      !toObjectId(inventoryItemId) ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !UNITS.includes(unit)
    ) {
      return null;
    }
    result.push({ inventoryItemId, quantity, unit });
  }
  return result;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ menuItemId: string }> }
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

    const { menuItemId: menuItemIdParam } = await params;
    const menuItemId = toObjectId(menuItemIdParam);
    if (!menuItemId) {
      return sendRJResponse({
        success: false,
        message: "Буруу цэсийн ID",
        status: 400,
      });
    }

    const menu = await Menu.findOne({
      ...merchantMenuQuery(merchantId),
      _id: menuItemId,
    }).lean();
    if (!menu) {
      return sendRJResponse({
        success: false,
        message: "Цэсийн бүтээгдэхүүн олдсонгүй",
        status: 404,
      });
    }

    const body = await req.json();
    const ingredients = parseIngredients(body.ingredients);
    if (!ingredients) {
      return sendRJResponse({
        success: false,
        message: "Буруу орцын мэдээлэл",
        status: 400,
      });
    }

    const itemIds = ingredients.map((i) => toObjectId(i.inventoryItemId)!);
    const uniqueItemIds = [
      ...new Map(itemIds.map((id) => [String(id), id])).values(),
    ];
    const validCount = await InventoryItem.countDocuments({
      merchantId,
      _id: { $in: uniqueItemIds },
    });
    if (validCount !== uniqueItemIds.length) {
      return sendRJResponse({
        success: false,
        message: "Зарим агуулахын бараа олдсонгүй",
        status: 400,
      });
    }

    const recipe = await Recipe.findOneAndUpdate(
      { merchantId, menuItemId },
      {
        merchantId,
        menuItemId,
        ingredients: ingredients.map((ing) => ({
          inventoryItemId: toObjectId(ing.inventoryItemId),
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      },
      { upsert: true, new: true }
    );

    return sendRJResponse({
      success: true,
      message: "Жор хадгалагдлаа",
      data: { _id: String(recipe._id) },
      status: 200,
    });
  } catch (error) {
    console.error("Error saving recipe:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ menuItemId: string }> }
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

    const { menuItemId: menuItemIdParam } = await params;
    const menuItemId = toObjectId(menuItemIdParam);
    if (!menuItemId) {
      return sendRJResponse({
        success: false,
        message: "Буруу цэсийн ID",
        status: 400,
      });
    }

    await Recipe.deleteOne({ merchantId, menuItemId });

    return sendRJResponse({
      success: true,
      message: "Жор устгагдлаа",
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
