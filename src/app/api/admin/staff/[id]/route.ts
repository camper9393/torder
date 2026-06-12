import { requireStaffManager } from "@/lib/auth";
import { getStaffUser, updateStaffUser } from "@/service/staffService";
import { UserRole } from "@/model/user";
import { sendRJResponse } from "@/utils/api";
import { isValidObjectId } from "mongoose";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
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
    const updates: {
      name?: string;
      email?: string;
      role?: UserRole;
      isActive?: boolean;
    } = {};

    if (typeof body.name === "string") updates.name = body.name;
    if (typeof body.email === "string") updates.email = body.email;
    if (typeof body.role === "string" && Object.values(UserRole).includes(body.role as UserRole)) {
      updates.role = body.role as UserRole;
    }
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

    const user = await updateStaffUser(authResult, id, updates);
    if (!user) {
      return sendRJResponse({
        success: false,
        message: "Ажилтан олдсонгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Ажилтны мэдээлэл шинэчлэгдлээ",
      data: user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    const status =
      message.includes("эрхгүй") ||
      message.includes("бүртгэгдсэн") ||
      message.includes("хоосон") ||
      message.includes("идэвхгүй")
        ? 400
        : 500;
    console.error("PATCH /api/admin/staff/[id] error:", error);
    return sendRJResponse({ success: false, message, status });
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
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

  const target = await getStaffUser(id);
  if (!target) {
    return sendRJResponse({
      success: false,
      message: "Ажилтан олдсонгүй",
      status: 404,
    });
  }

  const { canManageStaffMember } = await import("@/lib/permissions");
  if (!canManageStaffMember(authResult, target)) {
    return sendRJResponse({
      success: false,
      message: "Хандах эрхгүй",
      status: 403,
    });
  }

  const { toPublicUser } = await import("@/service/userAuth");
  return sendRJResponse({
    success: true,
    message: "Амжилттай",
    data: toPublicUser(target),
  });
}
