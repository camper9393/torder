import { requirePlatformOwner } from "@/lib/auth";
import { RestaurantPlan, SubscriptionStatus } from "@/model/restaurant";
import {
  deleteRestaurant,
  getRestaurant,
  updateRestaurant,
} from "@/service/restaurantService";
import { sendRJResponse } from "@/utils/api";
import { serializeRestaurant } from "@/utils/platformSerialize";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

const FORBIDDEN_PATCH = ["_id", "restaurantId", "slug", "createdAt", "updatedAt", "startDate"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await context.params;
    const restaurant = await getRestaurant(id);

    if (!restaurant) {
      return sendRJResponse({
        success: false,
        message: "Ресторан олдсонгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Амжилттай",
      data: serializeRestaurant(restaurant),
    });
  } catch (error) {
    console.error("GET /api/platform/restaurants/[id] error:", error);
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

  try {
    const { id } = await context.params;
    const body = await req.json();

    for (const field of FORBIDDEN_PATCH) {
      if (field in body) {
        return sendRJResponse({
          success: false,
          message: `${field} талбарыг өөрчлөх боломжгүй`,
          status: 400,
        });
      }
    }

    const restaurant = await updateRestaurant(id, {
      name: body.name,
      ownerName: body.ownerName,
      email: body.email,
      phone: body.phone,
      phone2: body.phone2,
      address: body.address,
      englishName: body.englishName,
      logoUrl: body.logoUrl,
      businessType: body.businessType,
      description: body.description,
      detailDescription: body.detailDescription,
      website: body.website,
      facebook: body.facebook,
      instagram: body.instagram,
      googleMapLink: body.googleMapLink,
      plan:
        body.plan && Object.values(RestaurantPlan).includes(body.plan)
          ? body.plan
          : undefined,
      maxTables: body.maxTables ? Number(body.maxTables) : undefined,
      maxUsers: body.maxUsers ? Number(body.maxUsers) : undefined,
      subscriptionStatus:
        body.subscriptionStatus &&
        Object.values(SubscriptionStatus).includes(body.subscriptionStatus)
          ? body.subscriptionStatus
          : undefined,
      expireDate: body.expireDate,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });

    if (!restaurant) {
      return sendRJResponse({
        success: false,
        message: "Ресторан олдсонгүй",
        status: 404,
      });
    }

    revalidatePath("/consumer", "layout");

    return sendRJResponse({
      success: true,
      message: "Амжилттай хадгаллаа",
      data: serializeRestaurant(restaurant),
    });
  } catch (error) {
    console.error("PATCH /api/platform/restaurants/[id] error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await context.params;
    const result = await deleteRestaurant(id);

    if (!result) {
      return sendRJResponse({
        success: false,
        message: "Ресторан олдсонгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: `"${result.restaurantName}" ресторан болон холбогдох өгөгдөл устгагдлаа`,
      data: result,
    });
  } catch (error) {
    console.error("DELETE /api/platform/restaurants/[id] error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
