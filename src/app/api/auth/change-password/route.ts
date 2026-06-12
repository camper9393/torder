import { requireAuth } from "@/lib/auth";
import { changeOwnPassword } from "@/service/profileService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await req.json();
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : typeof body.confirmNewPassword === "string"
          ? body.confirmNewPassword
          : "";

    await changeOwnPassword(
      authResult._id,
      currentPassword,
      newPassword,
      confirmPassword
    );

    return sendRJResponse({
      success: true,
      message: "Нууц үг амжилттай солигдлоо",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    console.error("POST /api/auth/change-password error:", error);
    return sendRJResponse({
      success: false,
      message,
      status: 400,
    });
  }
}
