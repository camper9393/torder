import {
  requireSettingsAccess,
  resolveSettingsRestaurantIdFromRequest,
} from "@/lib/settingsAuth";
import {
  auditLogsToCsv,
  listMerchantAuditLogs,
} from "@/service/settings/merchantAuditService";
import { NextRequest, NextResponse } from "next/server";

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
      limit: 500,
    });

    const csv = auditLogsToCsv(data);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-log-${Date.now()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET audit export error:", error);
    return NextResponse.json(
      { success: false, message: "Серверийн алдаа гарлаа" },
      { status: 500 }
    );
  }
}
