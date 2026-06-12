import { requirePlatformOwner } from "@/lib/auth";
import { UserRole } from "@/model/user";
import { updatePlatformUser } from "@/service/platformUserService";
import { sendRJResponse } from "@/utils/api";
import { isValidObjectId } from "mongoose";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const FORBIDDEN = ["restaurantId", "permissions", "passwordHash", "username"];

export async function PATCH(req: NextRequest, context: RouteContext) {
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

  try {
    const body = await req.json();
    for (const field of FORBIDDEN) {
      if (field in body) {
        return sendRJResponse({
          success: false,
          message: `${field} талбарыг өөрчлөх боломжгүй`,
          status: 400,
        });
      }
    }

    const role =
      typeof body.role === "string" &&
      Object.values(UserRole).includes(body.role as UserRole)
        ? (body.role as UserRole)
        : undefined;

    const data = await updatePlatformUser(authResult, id, {
      name: typeof body.name === "string" ? body.name : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      role,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });

    if (!data) {
      return sendRJResponse({
        success: false,
        message: "Хэрэглэгч олдсонгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Амжилттай хадгаллаа",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    return sendRJResponse({ success: false, message, status: 400 });
  }
}
