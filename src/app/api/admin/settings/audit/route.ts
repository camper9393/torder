import {
  requireSettingsAccess,
  resolveSettingsRestaurantIdFromRequest,
} from "@/lib/settingsAuth";
import { listMerchantAuditLogs } from "@/service/settings/merchantAuditService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireSettingsAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveSettingsRestaurantIdFromRequest(req, auth);
  if (restaurantId instanceof Response) return restaurantId;

  const { searchParams } = req.nextUrl;

  try {
    const data = await listMerchantAuditLogs({
      restaurantId,
      action: searchParams.get("action") ?? undefined,
      module: searchParams.get("module") ?? undefined,
      actorUserId: searchParams.get("userId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 100),
    });
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET audit logs error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
