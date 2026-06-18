import { resolveRestaurantContextId } from "@/lib/resolveRestaurantContextId";
import { requireReceiptSettingsReadAccess } from "@/lib/settingsAuth";
import { getOrCreatePaymentSettings } from "@/service/settings/paymentSettingsService";
import { sendRJResponse } from "@/utils/api";
import { buildEnabledPaymentMethodOptions } from "@/utils/paymentMethodOptions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireReceiptSettingsReadAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveRestaurantContextId(req, auth);
  if (restaurantId instanceof NextResponse) return restaurantId;

  try {
    const paymentSettings = await getOrCreatePaymentSettings(restaurantId);
    const options = buildEnabledPaymentMethodOptions({
      methods: paymentSettings.methods,
      integrations: paymentSettings.integrations,
    });

    return sendRJResponse({
      success: true,
      message: "Амжилттай",
      data: {
        restaurantId: String(restaurantId),
        options,
        paymentSettings,
      },
    });
  } catch (error) {
    console.error("GET payment methods error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
