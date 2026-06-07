import { verifyAuth } from "@/middleware/auth";
import { MQR } from "@/model/qrs";
import { sendRJResponse } from "@/utils/api";
import {
  DUPLICATE_TABLE_NAME_MESSAGE,
  ensureMerchantTableLayout,
  merchantTableNameExists,
} from "@/utils/merchantTableCatalog";
import { Types } from "mongoose";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const merchantId = await verifyAuth(req);

    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const { name } = await req.json();
    const tableName = typeof name === "string" ? name.trim() : "";

    if (!tableName) {
      return sendRJResponse({
        success: false,
        message: "QR name is required",
        status: 400,
      });
    }

    const merchantObjectId = new Types.ObjectId(String(merchantId));

    if (await merchantTableNameExists(merchantObjectId, tableName)) {
      return sendRJResponse({
        success: false,
        message: DUPLICATE_TABLE_NAME_MESSAGE,
        status: 409,
      });
    }

    const qr = await MQR.create({
      merchantId: merchantObjectId,
      name: tableName,
    });

    await ensureMerchantTableLayout(merchantObjectId, tableName);

    return sendRJResponse({
      success: true,
      message: "QR created successfully",
      data: qr,
      status: 201,
    });
  } catch (error) {
    console.error("Error while creating QR:", error);

    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
