import {
  requireSettingsAccess,
  resolveSettingsRestaurantIdFromRequest,
} from "@/lib/settingsAuth";
import {
  getOrCreateVatSettings,
  updateVatSettings,
} from "@/service/settings/vatSettingsService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireSettingsAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveSettingsRestaurantIdFromRequest(req, auth);
  if (restaurantId instanceof Response) return restaurantId;

  try {
    const data = await getOrCreateVatSettings(restaurantId);
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET vat settings error:", error);
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
    const data = await updateVatSettings(restaurantId, body);
    return sendRJResponse({
      success: true,
      message: "Амжилттай хадгаллаа",
      data,
    });
  } catch (error) {
    console.error("PATCH vat settings error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
