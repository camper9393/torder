import { requirePlatformOwner } from "@/lib/auth";
import { resetPlatformUserPassword } from "@/service/platformUserService";
import { sendRJResponse } from "@/utils/api";
import { isValidObjectId } from "mongoose";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  const { id } = await context.params;
  if (!isValidObjectId(id)) {
    return sendRJResponse({
      success: false,
      message: "Буруу хэрэглэгчийн ID",
      status: 400,
    });
  }

  if (String(authResult._id) === id) {
    return sendRJResponse({
      success: false,
      message: "Өөрийн нууц үгийг эндээс биш профайл хуудаснаас солино уу",
      status: 400,
    });
  }

  try {
    const body = await req.json();
    const password =
      typeof body.password === "string"
        ? body.password
        : typeof body.newPassword === "string"
          ? body.newPassword
          : "";

    const ok = await resetPlatformUserPassword(authResult, id, password);
    if (!ok) {
      return sendRJResponse({
        success: false,
        message: "Хэрэглэгч олдсонгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Нууц үг амжилттай шинэчлэгдлээ",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    return sendRJResponse({ success: false, message, status: 400 });
  }
}
