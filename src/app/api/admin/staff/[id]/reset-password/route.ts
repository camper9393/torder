import { requireStaffManager } from "@/lib/auth";
import { resetStaffPassword } from "@/service/staffService";
import { sendRJResponse } from "@/utils/api";
import { isValidObjectId } from "mongoose";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authResult = await requireStaffManager(req);
  if (authResult instanceof Response) return authResult;

  const { id } = await context.params;
  if (!isValidObjectId(id)) {
    return sendRJResponse({
      success: false,
      message: "Буруу хэрэглэгчийн ID",
      status: 400,
    });
  }

  try {
    const body = await req.json();
    const newPassword =
      typeof body.password === "string"
        ? body.password
        : typeof body.newPassword === "string"
          ? body.newPassword
          : "";

    const ok = await resetStaffPassword(authResult, id, newPassword);
    if (!ok) {
      return sendRJResponse({
        success: false,
        message: "Ажилтан олдсонгүй",
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
    const status =
      message.includes("эрхгүй") || message.includes("6 тэмдэгт") ? 400 : 500;
    console.error("POST /api/admin/staff/[id]/reset-password error:", error);
    return sendRJResponse({ success: false, message, status });
  }
}
