import { requirePlatformOwner } from "@/lib/auth";
import { SystemErrorLevel } from "@/model/systemError";
import { listSystemErrors } from "@/service/platformSystemErrorService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = req.nextUrl;
    const resolved = searchParams.get("resolved");
    const data = await listSystemErrors({
      level: (searchParams.get("level") as SystemErrorLevel) || undefined,
      restaurantId: searchParams.get("restaurantId") ?? undefined,
      resolved:
        resolved === "true" ? true : resolved === "false" ? false : undefined,
    });
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET /api/platform/errors error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
