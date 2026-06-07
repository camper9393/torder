import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import {
  createMerchantHall,
  deleteMerchantHall,
  ensureMerchantHalls,
} from "@/utils/tableHallStore";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await mongoServer();

    const merchantObjectId = await resolveMerchantId(req);
    if (!merchantObjectId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

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

    const merchantObjectId = await resolveMerchantId(req);
    if (!merchantObjectId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

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
