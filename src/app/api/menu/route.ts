import { Menu } from "@/model/menu";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";
import { Permission } from "@/lib/permissions";
import { requirePosScope } from "@/lib/tenant";
import { withRestaurantId } from "@/utils/tenantQuery";
import { Types } from "mongoose";

export async function DELETE(req: NextRequest) {
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

    const section = req.nextUrl.searchParams.get("section");

    if (!section) {
      return sendRJResponse({
        success: false,
        message: "Section is required",
        status: 400,
      });
    }

    const result = await Menu.deleteMany(
      withRestaurantId(
        {
          merchantId: new Types.ObjectId(String(merchantId)),
          section,
        },
        scope.restaurantId
      )
    );

    return sendRJResponse({
      success: true,
      message: "Section deleted successfully",
      data: {
        deletedCount: result.deletedCount,
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error while deleting section:", error);

    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
