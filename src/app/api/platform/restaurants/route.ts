import { requirePlatformOwner } from "@/lib/auth";
import {
  createRestaurant,
  getRestaurants,
} from "@/service/restaurantService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const restaurants = await getRestaurants();
    return sendRJResponse({
      success: true,
      message: "Амжилттай",
      data: restaurants,
    });
  } catch (error) {
    console.error("GET /api/platform/restaurants error:", error);
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
    const ownerUsername =
      typeof body.ownerUsername === "string" ? body.ownerUsername : "";
    const ownerPassword =
      typeof body.ownerPassword === "string" ? body.ownerPassword : "";

    const restaurant = await createRestaurant({
      name: body.name ?? "",
      ownerName: body.ownerName ?? "",
      email: body.email ?? "",
      phone: body.phone ?? "",
      address: body.address ?? "",
      ownerAccount:
        ownerUsername && ownerPassword
          ? { username: ownerUsername, password: ownerPassword }
          : undefined,
    });

    return sendRJResponse({
      success: true,
      message: "Ресторан амжилттай үүслээ",
      status: 201,
      data: restaurant,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    const status = message.includes("шаардлагатай") ? 400 : 500;
    console.error("POST /api/platform/restaurants error:", error);
    return sendRJResponse({
      success: false,
      message,
      status,
    });
  }
}
