import { requirePlatformOwner } from "@/lib/auth";
import { applyPlatformSupportContext } from "@/lib/platformSupportServer";
import mongoServer from "@/config/mongoConfig";
import { Restaurant } from "@/model/restaurant";
import { sendRJResponse } from "@/utils/api";
import { isValidObjectId } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return sendRJResponse({
        success: false,
        message: "Ресторан олдсонгүй",
        status: 404,
      });
    }

    await mongoServer();
    const restaurant = await Restaurant.findById(id).lean();

    if (!restaurant) {
      return sendRJResponse({
        success: false,
        message: "Ресторан олдсонгүй",
        status: 404,
      });
    }

    if (!restaurant.isActive) {
      return sendRJResponse({
        success: false,
        message: "Идэвхгүй рестораны системд нэвтрэх боломжгүй",
        status: 400,
      });
    }

    const redirectPath = "/admin/dashboard";
    const res = NextResponse.json({
      success: true,
      message: "Рестораны системд нэвтэрлээ",
      data: {
        redirectPath,
        restaurant: {
          id: String(restaurant._id),
          name: restaurant.name,
        },
      },
    });

    const applied = await applyPlatformSupportContext(
      res,
      restaurant._id,
      restaurant.name
    );

    if (!applied) {
      return sendRJResponse({
        success: false,
        message: "Рестораны merchant контекст үүсгэж чадсангүй",
        status: 500,
      });
    }

    return res;
  } catch (error) {
    console.error("POST /api/platform/restaurants/[id]/enter-system error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
