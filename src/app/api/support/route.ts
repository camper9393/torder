import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/model/user";
import {
  createSupportRequestForActorRestaurant,
  listSupportForRestaurant,
} from "@/service/supportTicketService";
import { SupportPriority, SupportType } from "@/model/supportRequest";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  if (!authResult.restaurantId) {
    return sendRJResponse({
      success: false,
      message: "Ресторанд хамаарахгүй хэрэглэгч",
      status: 403,
    });
  }

  try {
    const data = await listSupportForRestaurant(
      new Types.ObjectId(String(authResult.restaurantId))
    );
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET /api/support error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  if (authResult.role === UserRole.PLATFORM_OWNER && !authResult.restaurantId) {
    return sendRJResponse({
      success: false,
      message: "Рестораны контекст шаардлагатай",
      status: 400,
    });
  }

  try {
    const body = await req.json();
    const data = await createSupportRequestForActorRestaurant(authResult, {
      title: body.title ?? "",
      message: body.message ?? body.description ?? "",
      type: body.type as SupportType | undefined,
      priority: body.priority as SupportPriority | undefined,
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
    });
    return sendRJResponse({
      success: true,
      message: "Хүсэлт амжилттай илгээгдлээ",
      status: 201,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    return sendRJResponse({ success: false, message, status: 400 });
  }
}
