import mongoServer from "@/config/mongoConfig";
import { Permission } from "@/lib/permissions";
import { requirePosScope } from "@/lib/tenant";
import {
  createMerchantHall,
  deleteMerchantHall,
  ensureMerchantHalls,
} from "@/utils/tableHallStore";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

function posAuthMessage(res: Response): string {
  return res.status === 403
    ? "Энэ үйлдлийг хийх эрхгүй байна"
    : "Нэвтрэх шаардлагатай";
}

export async function POST(req: NextRequest) {
  try {
    await mongoServer();

    const scope = await requirePosScope(req, { permission: Permission.TABLES });
    if (scope instanceof Response) {
      return sendRJResponse({
        success: false,
        message: posAuthMessage(scope),
        status: scope.status,
      });
    }

    const merchantObjectId = scope.merchantId!;
    const hall = await createMerchantHall(merchantObjectId);
    const halls = await ensureMerchantHalls(merchantObjectId);

    return sendRJResponse({
      success: true,
      message: "Hall created",
      data: { hall, halls },
      status: 201,
    });
  } catch (error) {
    console.error("[POST /api/tables/layout/hall] error:", error);
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

    const scope = await requirePosScope(req, { permission: Permission.TABLES });
    if (scope instanceof Response) {
      return sendRJResponse({
        success: false,
        message: posAuthMessage(scope),
        status: scope.status,
      });
    }

    const merchantObjectId = scope.merchantId!;
    const hallId = req.nextUrl.searchParams.get("hallId")?.trim();
    if (!hallId) {
      return sendRJResponse({
        success: false,
        message: "hallId is required",
        status: 400,
      });
    }

    const result = await deleteMerchantHall(merchantObjectId, hallId);
    if (!result.ok) {
      return sendRJResponse({
        success: false,
        message: result.message,
        status: 409,
      });
    }

    const halls = await ensureMerchantHalls(merchantObjectId);

    return sendRJResponse({
      success: true,
      message: "Hall deleted",
      data: { halls },
      status: 200,
    });
  } catch (error) {
    console.error("[DELETE /api/tables/layout/hall] error:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
