import {
  requireReceiptSettingsReadAccess,
  requireSettingsAccess,
  resolveSettingsRestaurantIdFromRequest,
} from "@/lib/settingsAuth";
import {
  getOrCreateCompanySettings,
  updateCompanySettings,
} from "@/service/settings/companySettingsService";
import { sendRJResponse } from "@/utils/api";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireReceiptSettingsReadAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveSettingsRestaurantIdFromRequest(req, auth);
  if (restaurantId instanceof Response) return restaurantId;

  try {
    const data = await getOrCreateCompanySettings(restaurantId);
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET company settings error:", error);
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    return sendRJResponse({
      success: false,
      message,
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
    const body = (await req.json()) as Record<string, unknown>;
    console.log("PATCH /api/admin/settings/company body:", body);
    console.log("PATCH /api/admin/settings/company restaurantId:", String(restaurantId));

    const data = await updateCompanySettings(restaurantId, body);

    if (!data) {
      throw new Error("Рестораны мэдээлэл хадгалагдсангүй");
    }

    revalidatePath("/consumer", "layout");

    return sendRJResponse({
      success: true,
      message: "Амжилттай хадгаллаа",
      data,
    });
  } catch (error) {
    console.error("PATCH company settings error:", error);
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    return NextResponse.json(
      {
        success: false,
        message,
        error: message,
      },
      { status: 500 }
    );
  }
}
