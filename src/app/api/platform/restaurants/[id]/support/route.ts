import { requirePlatformOwner } from "@/lib/auth";
import { getRestaurantSupport } from "@/service/platformRestaurantService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  const { id } = await context.params;
  try {
    const data = await getRestaurantSupport(id);
    if (!data) {
      return sendRJResponse({
        success: false,
        message: "Ресторан олдсонгүй",
        status: 404,
      });
    }
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET restaurant support error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
