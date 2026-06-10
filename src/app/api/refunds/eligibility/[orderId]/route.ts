import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { sendRJResponse } from "@/utils/api";
import { getRefundEligibility } from "@/utils/refundService";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
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

    const { orderId } = await context.params;
    const eligibility = await getRefundEligibility(merchantId, orderId);

    if (!eligibility) {
      return sendRJResponse({
        success: false,
        message: "Захиалга олдсонгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Refund eligibility fetched",
      data: eligibility,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching refund eligibility:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
