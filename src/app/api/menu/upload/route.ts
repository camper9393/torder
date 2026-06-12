import { Menu } from "@/model/menu";
import { uploadToCloudinary } from "@/service/cloudnary";
import { sendRJResponse } from "@/utils/api";
import {
  menuBodyToDbSet,
  parseMenuBodyFromFormData,
} from "@/utils/menuApiPayload";
import { NextRequest } from "next/server";
import { Permission } from "@/lib/permissions";
import { requirePosScope } from "@/lib/tenant";
import { Types } from "mongoose";

export async function POST(req: NextRequest) {
  try {
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

    const merchantId = scope.merchantId!;

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    const { body, error } = parseMenuBodyFromFormData(formData);
    if (error || !body) {
      return sendRJResponse({
        success: false,
        status: 400,
        message: error ?? "Invalid input data",
      });
    }

    if (!file) {
      return sendRJResponse({
        success: false,
        status: 400,
        message: "Image is required",
      });
    }

    if (!file.type.startsWith("image/")) {
      return sendRJResponse({
        success: false,
        status: 400,
        message: "Only image files allowed",
      });
    }

    if (file.size > 12 * 1024 * 1024) {
      return sendRJResponse({
        success: false,
        status: 400,
        message: "File is too large",
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const imageUrl = await uploadToCloudinary(
      buffer,
      `qr-menu/${merchantId}`
    );

    const quantityRaw = formData.get("quantity");
    const quantity =
      quantityRaw !== null && quantityRaw !== ""
        ? Number(quantityRaw)
        : 0;

    const menu = await Menu.create({
      merchantId: new Types.ObjectId(String(merchantId)),
      restaurantId: scope.restaurantId ?? undefined,
      image: imageUrl,
      quantity,
      ...menuBodyToDbSet(body),
    });

    return sendRJResponse({
      success: true,
      message: "Menu uploaded successfully",
      data: menu,
      status: 201,
    });
  } catch (error) {
    console.error("Error while menu upload:", error);

    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
