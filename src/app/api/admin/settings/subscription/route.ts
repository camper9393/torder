import {
  requireSettingsAccess,
  resolveSettingsRestaurantIdFromRequest,
} from "@/lib/settingsAuth";
import { getSubscriptionOverview } from "@/service/settings/subscriptionSettingsService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireSettingsAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveSettingsRestaurantIdFromRequest(req, auth);
  if (restaurantId instanceof Response) return restaurantId;

  try {
    const data = await getSubscriptionOverview(restaurantId);
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET subscription settings error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
