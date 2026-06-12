import {
  requireStaffManager,
  resolveStaffRestaurantId,
} from "@/lib/auth";
import {
  createStaffUser,
  listStaffForRestaurant,
  staffRolesForActor,
} from "@/service/staffService";
import { UserRole } from "@/model/user";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await requireStaffManager(req);
  if (authResult instanceof Response) return authResult;

  try {
    const restaurantParam = req.nextUrl.searchParams.get("restaurantId");
    const restaurantId = await resolveStaffRestaurantId(
      req,
      authResult,
      restaurantParam
    );
    if (restaurantId instanceof Response) return restaurantId;

    const staff = await listStaffForRestaurant(restaurantId);
    const assignableRoles = staffRolesForActor(authResult);

    return sendRJResponse({
      success: true,
      message: "Амжилттай",
      data: {
        staff,
        restaurantId: restaurantId.toHexString(),
        assignableRoles,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/staff error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireStaffManager(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const restaurantParam =
      typeof body.restaurantId === "string" ? body.restaurantId : null;
    const restaurantId = await resolveStaffRestaurantId(
      req,
      authResult,
      restaurantParam
    );
    if (restaurantId instanceof Response) return restaurantId;

    const role = body.role as UserRole;
    if (!role || !Object.values(UserRole).includes(role)) {
      return sendRJResponse({
        success: false,
        message: "Зөв үүрэг сонгоно уу",
        status: 400,
      });
    }

    const user = await createStaffUser(authResult, {
      name: body.name ?? "",
      email: body.email ?? "",
      username: body.username ?? "",
      password: body.password ?? "",
      role,
      restaurantId,
    });

    return sendRJResponse({
      success: true,
      message: "Ажилтан амжилттай нэмэгдлээ",
      status: 201,
      data: user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    const status =
      message.includes("эрхгүй") ||
      message.includes("бүртгэгдсэн") ||
      message.includes("хязгаар") ||
      message.includes("шаардлагатай") ||
      message.includes("6 тэмдэгт")
        ? 400
        : 500;
    console.error("POST /api/admin/staff error:", error);
    return sendRJResponse({ success: false, message, status });
  }
}
