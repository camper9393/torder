import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Menu } from "@/model/menu";
import { sendRJResponse } from "@/utils/api";
import {
  parseSpicyLevel,
  parseSpicyValue,
  spicyLevelToDbFields,
} from "@/utils/menuSpicy";
import { isValidMenuItemId } from "@/utils/menuItemId";
import { NextRequest } from "next/server";
import mongoose from "mongoose";

export async function PATCH(req: NextRequest) {
  try {
    await mongoServer();

    const merchantId = await resolveMerchantId(req);
    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";

    let spicyLevel = parseSpicyLevel(body?.spicyLevel);
    if (spicyLevel === null && body?.spicy !== undefined) {
      const legacy = parseSpicyValue(body.spicy);
      if (legacy !== null) {
        spicyLevel = legacy ? 1 : 0;
      }
    }

    if (!id || !isValidMenuItemId(id)) {
      return sendRJResponse({
        success: false,
        message: "Valid menu id is required",
        status: 400,
      });
    }

    if (spicyLevel === null) {
      return sendRJResponse({
        success: false,
        message: "spicyLevel must be 0–4",
        status: 400,
      });
    }

    const menuObjectId = new mongoose.Types.ObjectId(id);
    const spicyFields = spicyLevelToDbFields(spicyLevel);

    const updatedMenu = await Menu.findOneAndUpdate(
      { _id: menuObjectId, merchantId },
      { $set: spicyFields },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedMenu) {
      return sendRJResponse({
        success: false,
        message: "Menu item not found",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Menu item updated successfully",
      data: updatedMenu,
      status: 200,
    });
  } catch (error) {
    console.error("[PATCH /api/menu/item] error:", error);

    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await mongoServer();

    const merchantId = await resolveMerchantId(req);
    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const id = req.nextUrl.searchParams.get("id");

    if (!id || !isValidMenuItemId(id)) {
      return sendRJResponse({
        success: false,
        message: "Valid menu id is required",
        status: 400,
      });
    }

    const deletedMenu = await Menu.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      merchantId,
    });

    if (!deletedMenu) {
      return sendRJResponse({
        success: false,
        message: "Menu item not found",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Menu item deleted successfully",
      data: deletedMenu,
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);

    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
