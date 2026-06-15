import { getCurrentUser } from "@/lib/auth";
import { setupInitialPasscode } from "@/service/passcodeService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return sendRJResponse({
      success: false,
      message: "Нэвтрэх шаардлагатай",
      status: 401,
    });
  }

  try {
    const body = await req.json();
    const newPasscode =
      typeof body.newPasscode === "string" ? body.newPasscode : "";

    const result = await setupInitialPasscode(user._id, newPasscode);
    if (!result.ok) {
      return sendRJResponse({
        success: false,
        message: result.message,
        status: 400,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Пин код амжилттай хадгалагдлаа",
    });
  } catch (error) {
    console.error("POST /api/auth/passcode/setup error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
