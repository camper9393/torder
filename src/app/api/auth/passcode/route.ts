import { getCurrentUser } from "@/lib/auth";
import {
  getPasscodeStatus,
  removePasscode,
  setPasscode,
} from "@/service/passcodeService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return sendRJResponse({
      success: false,
      message: "Нэвтрэх шаардлагатай",
      status: 401,
    });
  }

  const status = await getPasscodeStatus(user._id);
  return sendRJResponse({
    success: true,
    message: "Амжилттай",
    data: status ?? { enabled: false },
  });
}

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
    const result = await setPasscode(user._id, {
      newPasscode: typeof body.newPasscode === "string" ? body.newPasscode : "",
      currentPassword:
        typeof body.currentPassword === "string"
          ? body.currentPassword
          : undefined,
      currentPasscode:
        typeof body.currentPasscode === "string"
          ? body.currentPasscode
          : undefined,
    });

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
    console.error("POST /api/auth/passcode error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return sendRJResponse({
      success: false,
      message: "Нэвтрэх шаардлагатай",
      status: 401,
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await removePasscode(user._id, {
      currentPassword:
        typeof body.currentPassword === "string"
          ? body.currentPassword
          : undefined,
      currentPasscode:
        typeof body.currentPasscode === "string"
          ? body.currentPasscode
          : undefined,
    });

    if (!result.ok) {
      return sendRJResponse({
        success: false,
        message: result.message,
        status: 400,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Пин код устгагдлаа",
    });
  } catch (error) {
    console.error("DELETE /api/auth/passcode error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
