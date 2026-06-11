import { USER_TOKEN_COOKIE } from "@/lib/auth";
import { ensureInitialPlatformOwner, loginUser } from "@/service/userAuth";
import { NextRequest, NextResponse } from "next/server";
import mongoServer from "@/config/mongoConfig";

export async function POST(req: NextRequest) {
  try {
    await mongoServer();
    await ensureInitialPlatformOwner();

    const body = await req.json();
    const password = typeof body.password === "string" ? body.password : "";
    const login =
      typeof body.login === "string"
        ? body.login
        : typeof body.username === "string"
          ? body.username
          : typeof body.email === "string"
            ? body.email
            : "";

    if (!login || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Хэрэглэгчийн нэр/имэйл болон нууц үг оруулна уу",
        },
        { status: 400 }
      );
    }

    const result = await loginUser(login, password);
    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Хэрэглэгчийн нэр эсвэл нууц үг буруу байна",
        },
        { status: 401 }
      );
    }

    const res = NextResponse.json(
      {
        success: true,
        user: result.user,
      },
      { status: 200 }
    );

    res.cookies.set(USER_TOKEN_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Серверийн алдаа гарлаа",
      },
      { status: 500 }
    );
  }
}
