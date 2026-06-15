import { requirePlatformOwner } from "@/lib/auth";
import { markNotificationRead } from "@/service/notificationService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;
  const { id } = await context.params;

  try {
    const data = await markNotificationRead(authResult._id, id);
    if (!data) {
      return sendRJResponse({
        success: false,
        message: "Мэдэгдэл олдсонгүй",
        status: 404,
      });
    }
    return sendRJResponse({
      success: true,
      message: "Уншсан болголоо",
      data,
    });
  } catch (error) {
    console.error("PATCH /api/notifications/[id] error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
