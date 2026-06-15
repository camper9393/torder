import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/model/user";
import { getSupportTicketDetail } from "@/service/supportTicketService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(req);
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

    if (authResult.role !== UserRole.PLATFORM_OWNER) {
      if (
        !authResult.restaurantId ||
        data.ticket.restaurantId !== String(authResult.restaurantId)
      ) {
        return sendRJResponse({
          success: false,
          message: "Хандах эрхгүй",
          status: 403,
        });
      }
    }

    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET /api/support/[id] error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
