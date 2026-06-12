import { requirePlatformOwner } from "@/lib/auth";
import { logActivity } from "@/service/activityLogService";
import { extendRestaurantSubscription } from "@/service/platformRestaurantService";
import { sendRJResponse } from "@/utils/api";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  const { id } = await context.params;
  try {
    const body = await req.json();
    const months = Number(body.months) || 1;
    const data = await extendRestaurantSubscription(id, months);
    if (!data) {
      return sendRJResponse({
        success: false,
        message: "Ресторан олдсонгүй",
        status: 404,
      });
    }

    await logActivity({
      actorUserId: authResult._id,
      actorRole: authResult.role,
      restaurantId: isValidObjectId(id) ? new Types.ObjectId(id) : undefined,
      action: "restaurant.subscription_extended",
      targetType: "restaurant",
      targetId: id,
      message: `Захиалга ${months} сараар сунгагдлаа`,
      metadata: { months },
    });

    return sendRJResponse({
      success: true,
      message: "Захиалга амжилттай сунгагдлаа",
      data,
    });
  } catch (error) {
    console.error("POST extend-subscription error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
