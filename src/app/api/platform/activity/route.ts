import { requirePlatformOwner } from "@/lib/auth";
import { listActivityLogs } from "@/service/activityLogService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = req.nextUrl;
    const data = await listActivityLogs({
      action: searchParams.get("action") ?? undefined,
      restaurantId: searchParams.get("restaurantId") ?? undefined,
      actorUserId: searchParams.get("actorUserId") ?? undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
    });
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET /api/platform/activity error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
