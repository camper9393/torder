import { resolveRestaurantContextId } from "@/lib/resolveRestaurantContextId";
import { requireReceiptSettingsReadAccess } from "@/lib/settingsAuth";
import { getOrCreateCompanySettings } from "@/service/settings/companySettingsService";
import { getOrCreateReceiptSettings } from "@/service/settings/receiptSettingsService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireReceiptSettingsReadAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveRestaurantContextId(req, auth);
  if (restaurantId instanceof NextResponse) return restaurantId;

  try {
    const [companySettings, receiptSettings] = await Promise.all([
      getOrCreateCompanySettings(restaurantId),
      getOrCreateReceiptSettings(restaurantId),
    ]);

    return sendRJResponse({
      success: true,
      message: "Амжилттай",
      data: {
        restaurantId: String(restaurantId),
        companySettings,
        receiptSettings,
        company: companySettings,
        receipt: receiptSettings,
      },
    });
  } catch (error) {
    console.error("GET receipt context error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
