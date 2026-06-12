import { requirePlatformOwner } from "@/lib/auth";
import { resolveSystemError } from "@/service/platformSystemErrorService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  const { id } = await context.params;
  try {
    const data = await resolveSystemError(id);
    if (!data) {
      return sendRJResponse({
        success: false,
        message: "Алдаа олдсонгүй",
        status: 404,
      });
    }
    return sendRJResponse({
      success: true,
      message: "Шийдэгдсэн гэж тэмдэглэгдлээ",
      data,
    });
  } catch (error) {
    console.error("PATCH /api/platform/errors/[id] error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
