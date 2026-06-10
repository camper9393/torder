import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { sendRJResponse } from "@/utils/api";
import {
  resolveReportDateRange,
  validateCustomReportRange,
} from "@/utils/reports/dateRange";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
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

    const params = req.nextUrl.searchParams;
    const rangeError = validateCustomReportRange(
      params.get("preset"),
      params.get("from"),
      params.get("to")
    );
    if (rangeError) {
      return sendRJResponse({
        success: false,
        message: rangeError,
        status: 400,
      });
    }
    const range = resolveReportDateRange(
      params.get("preset") || "last7",
      params.get("from"),
      params.get("to")
    );

    return sendRJResponse({
      success: true,
      message: "Waiter report fetched",
      data: {
        available: false,
        message:
          "Зөөгчийн мэдээлэл одоогоор захиалгад хадгалагддаггүй. Зөөгчийн тайлангийн өгөгдөл байхгүй.",
        range: {
          label: range.label,
          from: range.start.toISOString(),
          to: range.end.toISOString(),
        },
        metrics: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          mostActiveWaiter: null,
        },
        waiters: [],
        revenueByWaiter: [],
        ordersByWaiter: [],
      },
      status: 200,
    });
  } catch (error) {
    console.error("Waiter report error:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
