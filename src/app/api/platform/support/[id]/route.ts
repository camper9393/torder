import { requirePlatformOwner } from "@/lib/auth";
import { SupportPriority, SupportStatus } from "@/model/supportRequest";
import {
  getSupportTicketDetail,
  updateSupportRequest,
} from "@/service/supportTicketService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  const { id } = await context.params;

  try {
    const data = await getSupportTicketDetail(id);
    if (!data) {
      return sendRJResponse({
        success: false,
        message: "Хүсэлт олдсонгүй",
        status: 404,
      });
    }
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET /api/platform/support/[id] error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  const { id } = await context.params;
  try {
    const body = await req.json();
    const data = await updateSupportRequest(authResult, id, {
      status: body.status as SupportStatus | undefined,
      adminNote: typeof body.adminNote === "string" ? body.adminNote : undefined,
      priority: body.priority as SupportPriority | undefined,
    });

    if (!data) {
      return sendRJResponse({
        success: false,
        message: "Хүсэлт олдсонгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Амжилттай хадгаллаа",
      data,
    });
  } catch (error) {
    console.error("PATCH /api/platform/support/[id] error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
