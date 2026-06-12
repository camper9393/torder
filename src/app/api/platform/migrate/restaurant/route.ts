import { requirePlatformOwner } from "@/lib/auth";
import { migrateRestaurantOwnership } from "@/service/restaurantMigration";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const report = await migrateRestaurantOwnership();
    return sendRJResponse({
      success: report.success,
      message: report.success
        ? "Migration амжилттай"
        : "Migration дутуу дууслаа — warnings талбарыг шалгана уу",
      status: report.success ? 200 : 409,
      data: report,
    });
  } catch (error) {
    console.error("Restaurant migration error:", error);
    return sendRJResponse({
      success: false,
      message: "Migration алдаатай дууслаа",
      status: 500,
    });
  }
}
