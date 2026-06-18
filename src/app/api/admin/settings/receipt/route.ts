import {
  requireReceiptSettingsReadAccess,
  requireSettingsAccess,
  resolveSettingsRestaurantIdFromRequest,
} from "@/lib/settingsAuth";
import {
  getOrCreateReceiptSettings,
  updateReceiptSettings,
} from "@/service/settings/receiptSettingsService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireReceiptSettingsReadAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveSettingsRestaurantIdFromRequest(req, auth);
  if (restaurantId instanceof Response) return restaurantId;

  try {
    const data = await getOrCreateReceiptSettings(restaurantId);
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET receipt settings error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSettingsAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveSettingsRestaurantIdFromRequest(req, auth);
  if (restaurantId instanceof Response) return restaurantId;

  try {
    const body = await req.json();
    const data = await updateReceiptSettings(restaurantId, body);
    return sendRJResponse({
      success: true,
      message: "Амжилттай хадгаллаа",
      data,
    });
  } catch (error) {
    console.error("PATCH receipt settings error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
