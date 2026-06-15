import { applyUserLoginCookies } from "@/lib/auth";
import { ensureInitialPlatformOwner } from "@/service/userAuth";
import { loginWithPasscode } from "@/service/passcodeService";
import mongoServer from "@/config/mongoConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await mongoServer();
    await ensureInitialPlatformOwner();

    const body = await req.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    const passcode = typeof body.passcode === "string" ? body.passcode : "";

    if (!userId || !passcode) {
      return NextResponse.json(
        { success: false, message: "Хэрэглэгч болон пин код шаардлагатай" },
        { status: 400 }
      );
    }

    const result = await loginWithPasscode(userId, passcode);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status }
      );
    }

    const res = NextResponse.json(
      { success: true, user: result.user },
      { status: 200 }
    );

    await applyUserLoginCookies(res, result.token, result.user);

    return res;
  } catch (error) {
    console.error("Passcode login route error:", error);
    return NextResponse.json(
      { success: false, message: "Серверийн алдаа гарлаа" },
      { status: 500 }
    );
  }
}
