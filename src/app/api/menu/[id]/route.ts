import mongoServer from "@/config/mongoConfig";
import { Permission } from "@/lib/permissions";
import { requirePosScope } from "@/lib/tenant";
import { Menu } from "@/model/menu";
import { uploadToCloudinary } from "@/service/cloudnary";
import { sendRJResponse } from "@/utils/api";
import { isValidMenuItemId } from "@/utils/menuItemId";
import {
  menuBodyToDbSet,
  parseMenuBodyFromFormData,
} from "@/utils/menuApiPayload";
import { scopedMerchantMenuQuery } from "@/utils/menuMerchantScope";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

async function parseMenuUpdatePayload(
  req: NextRequest,
  merchantIdHex: string
): Promise<{ $set: Record<string, unknown> | null; error?: string }> {
  const contentType = req.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return { $set: null, error: "Expected multipart form data" };
  }

  const formData = await req.formData();
  const { body, error } = parseMenuBodyFromFormData(formData);
  if (error || !body) {
    return { $set: null, error: error ?? "Invalid menu data" };
  }

  const $set = menuBodyToDbSet(body);

  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { $set: null, error: "Only image files allowed" };
    }
    if (file.size > 12 * 1024 * 1024) {
      return { $set: null, error: "File is too large" };
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageUrl = await uploadToCloudinary(
      buffer,
      `qr-menu/${merchantIdHex}`
    );
    $set.image = imageUrl;
  }

  return { $set };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await mongoServer();

    const scope = await requirePosScope(req, { permission: Permission.MENU });
    if (scope instanceof Response) {
      return sendRJResponse({
        success: false,
        message:
          scope.status === 403
            ? "Энэ үйлдлийг хийх эрхгүй байна"
            : "Нэвтрэх шаардлагатай",
        status: scope.status,
      });
    }

    const merchantObjectId = scope.merchantId!;
    const { id } = await params;
    if (!id || !isValidMenuItemId(id)) {
      return sendRJResponse({
        success: false,
        message: "Valid menu id is required",
        status: 400,
      });
    }

    const { $set, error } = await parseMenuUpdatePayload(
      req,
      merchantObjectId.toHexString()
    );
    if (error || !$set) {
      return sendRJResponse({
        success: false,
        message: error ?? "Invalid menu data",
        status: 400,
      });
    }

    const menuObjectId = new mongoose.Types.ObjectId(id);

    const updatedMenu = await Menu.findOneAndUpdate(
      scopedMerchantMenuQuery(merchantObjectId, scope.restaurantId, { _id: menuObjectId }),
      { $set },
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
    console.error("[PATCH /api/menu/[id]] error:", error);

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

    const scope = await requirePosScope(req, { permission: Permission.MENU });
    if (scope instanceof Response) {
      return sendRJResponse({
        success: false,
        message:
          scope.status === 403
            ? "Энэ үйлдлийг хийх эрхгүй байна"
            : "Нэвтрэх шаардлагатай",
        status: scope.status,
      });
    }

    const merchantObjectId = scope.merchantId!;
    const { id } = await params;
    if (!id || !isValidMenuItemId(id)) {
      return sendRJResponse({
        success: false,
        message: "Valid menu id is required",
        status: 400,
      });
    }

    const menuObjectId = new mongoose.Types.ObjectId(id);

    const deletedMenu = await Menu.findOneAndDelete(
      scopedMerchantMenuQuery(merchantObjectId, scope.restaurantId, { _id: menuObjectId })
    );

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
    console.error("[DELETE /api/menu/[id]] error:", error);

    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
