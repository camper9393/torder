import { getCurrentPublicUser } from "@/lib/auth";
import { ensureInitialPlatformOwner } from "@/service/userAuth";
import mongoServer from "@/config/mongoConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await mongoServer();
    await ensureInitialPlatformOwner();

    const user = await getCurrentPublicUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Нэвтрээгүй байна" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Auth me route error:", error);
    return NextResponse.json(
      { success: false, message: "Серверийн алдаа гарлаа" },
      { status: 500 }
    );
  }
}
