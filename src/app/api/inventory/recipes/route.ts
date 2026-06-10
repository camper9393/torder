import mongoServer from "@/config/mongoConfig";
import { Menu } from "@/model/menu";
import { InventoryItem } from "@/model/inventoryItem";
import { Recipe, type IRecipeIngredient } from "@/model/recipe";
import { sendRJResponse } from "@/utils/api";
import { requireInventoryMerchantId } from "@/utils/inventoryApi";
import { merchantMenuQuery } from "@/utils/menuMerchantScope";
import { normalizeMenuDocument } from "@/utils/menuBilingual";
import type { RecipeRow } from "@/types/inventory";
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

    const search = (req.nextUrl.searchParams.get("search") || "").trim();

    const [menus, recipes] = await Promise.all([
      Menu.find(merchantMenuQuery(merchantId)).lean(),
      Recipe.find({ merchantId }).lean(),
    ]);

    const recipeByMenu = new Map(
      recipes.map((r) => [String(r.menuItemId), r])
    );

    const inventoryIds = new Set<string>();
    for (const recipe of recipes) {
      for (const ing of recipe.ingredients) {
        inventoryIds.add(String(ing.inventoryItemId));
      }
    }

    const inventoryRows = await InventoryItem.find({
      _id: { $in: [...inventoryIds] },
      merchantId,
    })
      .select("name currentStock unit")
      .lean();

    const inventoryMap = new Map(
      inventoryRows.map((row) => [String(row._id), row])
    );

    let rows: RecipeRow[] = menus.map((menu) => {
      const normalized = normalizeMenuDocument(menu);
      const recipe = recipeByMenu.get(String(menu._id));
      const ingredients = (recipe?.ingredients ?? []).map((ing: IRecipeIngredient) => {
        const inv = inventoryMap.get(String(ing.inventoryItemId));
        return {
          inventoryItemId: String(ing.inventoryItemId),
          itemName: inv?.name ?? "—",
          quantity: ing.quantity,
          unit: ing.unit,
          currentStock: inv?.currentStock ?? 0,
        };
      });

      return {
        _id: recipe ? String(recipe._id) : "",
        menuItemId: String(menu._id),
        menuItemName: normalized.title,
        menuItemImage: normalized.image,
        ingredients,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (row) =>
          row.menuItemName.toLowerCase().includes(q) ||
          row.ingredients.some((ing) =>
            ing.itemName.toLowerCase().includes(q)
          )
      );
    }

    return sendRJResponse({
      success: true,
      message: "Recipes fetched",
      data: rows,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
