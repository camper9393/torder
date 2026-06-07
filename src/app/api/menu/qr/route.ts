import { verifyAuth } from "@/middleware/auth";
import { sendRJResponse } from "@/utils/api";
import { loadMerchantTableQrList } from "@/utils/merchantTableCatalog";
import { Types } from "mongoose";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const merchantId = await verifyAuth(req);

    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const qrs = await loadMerchantTableQrList(new Types.ObjectId(String(merchantId)));

    return sendRJResponse({
      success: true,
      message: "QRs fetched successfully",
      data: qrs,
      status: 200,
    });
  } catch (error) {
    console.error("Error while fetching QRs:", error);

    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
