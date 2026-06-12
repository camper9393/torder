import { requirePlatformOwner } from "@/lib/auth";
import { RestaurantPlan } from "@/model/restaurant";
import {
  getOrCreatePlatformSettings,
  updatePlatformSettings,
} from "@/service/platformSettingsService";
import { logActivity } from "@/service/activityLogService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const data = await getOrCreatePlatformSettings();
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET /api/platform/settings error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function PATCH(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const data = await updatePlatformSettings({
      platformName: body.platformName,
      supportEmail: body.supportEmail,
      defaultTrialDays: body.defaultTrialDays
        ? Number(body.defaultTrialDays)
        : undefined,
      defaultMaxTables: body.defaultMaxTables
        ? Number(body.defaultMaxTables)
        : undefined,
      defaultMaxUsers: body.defaultMaxUsers
        ? Number(body.defaultMaxUsers)
        : undefined,
      defaultPlan:
        body.defaultPlan &&
        Object.values(RestaurantPlan).includes(body.defaultPlan)
          ? body.defaultPlan
          : undefined,
      currency: body.currency,
    });

    await logActivity({
      actorUserId: authResult._id,
      actorRole: authResult.role,
      action: "settings.updated",
      message: "Platform тохиргоо шинэчлэгдлээ",
    });

    return sendRJResponse({
      success: true,
      message: "Амжилттай хадгаллаа",
      data,
    });
  } catch (error) {
    console.error("PATCH /api/platform/settings error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
