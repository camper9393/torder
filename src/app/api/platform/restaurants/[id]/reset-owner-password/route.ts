import { requirePlatformOwner } from "@/lib/auth";
import { resetRestaurantOwnerPassword } from "@/service/platformRestaurantService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  const { id } = await context.params;
  try {
    const body = await req.json();
    const password =
      typeof body.password === "string"
        ? body.password
        : typeof body.newPassword === "string"
          ? body.newPassword
          : "";

    const result = await resetRestaurantOwnerPassword(authResult, id, password);
    if (!result) {
      return sendRJResponse({
        success: false,
        message: "Эзэмшигч олдсонгүй эсвэл нууц үг солих боломжгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Эзэмшигчийн нууц үг амжилттай шинэчлэгдлээ",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    return sendRJResponse({ success: false, message, status: 400 });
  }
}
