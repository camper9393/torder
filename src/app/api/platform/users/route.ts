import { requirePlatformOwner } from "@/lib/auth";
import { UserRole } from "@/model/user";
import {
  createPlatformUser,
  listPlatformUsers,
} from "@/service/platformUserService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = req.nextUrl;
    const role = searchParams.get("role");
    const active = searchParams.get("active");
    const data = await listPlatformUsers({
      role: role && Object.values(UserRole).includes(role as UserRole)
        ? (role as UserRole)
        : undefined,
      restaurantId: searchParams.get("restaurantId") ?? undefined,
      active: active === "true" ? true : active === "false" ? false : undefined,
      search: searchParams.get("search") ?? undefined,
    });
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET /api/platform/users error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();

    if (
      typeof body.role !== "string" ||
      !Object.values(UserRole).includes(body.role as UserRole)
    ) {
      return sendRJResponse({
        success: false,
        message: "Буруу эрх (role)",
        status: 400,
      });
    }

    const data = await createPlatformUser(authResult, {
      name: String(body.name ?? "").trim(),
      email: String(body.email ?? "").trim(),
      username: String(body.username ?? "").trim(),
      password: String(body.password ?? ""),
      role: body.role as UserRole,
      restaurantId: String(body.restaurantId ?? ""),
    });

    return sendRJResponse({
      success: true,
      message: "Хэрэглэгч амжилттай үүсгэлээ",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    return sendRJResponse({ success: false, message, status: 400 });
  }
}
