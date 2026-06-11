import { requirePlatformOwner } from "@/lib/auth";
import { deactivateRestaurant } from "@/service/restaurantService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await context.params;
    const restaurant = await deactivateRestaurant(id);

    if (!restaurant) {
      return sendRJResponse({
        success: false,
        message: "Ресторан олдсонгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Ресторан идэвхгүй боллоо",
      data: restaurant,
    });
  } catch (error) {
    console.error("POST deactivate restaurant error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
