import { requirePlatformOwner } from "@/lib/auth";
import {
  SupportPriority,
  SupportStatus,
  SupportType,
} from "@/model/supportRequest";
import {
  createSupportRequest,
  listSupportRequests,
} from "@/service/platformSupportService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = req.nextUrl;
    const data = await listSupportRequests({
      status: (searchParams.get("status") as SupportStatus) || undefined,
      type: (searchParams.get("type") as SupportType) || undefined,
      priority: (searchParams.get("priority") as SupportPriority) || undefined,
      restaurantId: searchParams.get("restaurantId") ?? undefined,
    });
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET /api/platform/support error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const data = await createSupportRequest(authResult, {
      restaurantId: body.restaurantId ?? "",
      title: body.title ?? "",
      message: body.message ?? "",
      type: body.type,
      priority: body.priority,
    });
    return sendRJResponse({
      success: true,
      message: "Support хүсэлт үүслээ",
      status: 201,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    return sendRJResponse({ success: false, message, status: 400 });
  }
}
