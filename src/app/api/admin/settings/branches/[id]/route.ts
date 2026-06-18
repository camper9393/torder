import {
  requireSettingsAccess,
  resolveSettingsRestaurantIdFromRequest,
} from "@/lib/settingsAuth";
import { BranchStatus } from "@/model/branch";
import {
  deleteBranch,
  updateBranch,
} from "@/service/settings/branchService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requireSettingsAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveSettingsRestaurantIdFromRequest(req, auth);
  if (restaurantId instanceof Response) return restaurantId;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const data = await updateBranch(restaurantId, id, {
      ...body,
      status: body.status as BranchStatus | undefined,
    });
    if (!data) {
      return sendRJResponse({
        success: false,
        message: "Салбар олдсонгүй",
        status: 404,
      });
    }
    return sendRJResponse({
      success: true,
      message: "Амжилттай хадгаллаа",
      data,
    });
  } catch (error) {
    console.error("PATCH branch error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await requireSettingsAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveSettingsRestaurantIdFromRequest(req, auth);
  if (restaurantId instanceof Response) return restaurantId;

  const { id } = await context.params;

  try {
    const ok = await deleteBranch(restaurantId, id);
    if (!ok) {
      return sendRJResponse({
        success: false,
        message: "Салбар олдсонгүй",
        status: 404,
      });
    }
    return sendRJResponse({ success: true, message: "Устгагдлаа" });
  } catch (error) {
    console.error("DELETE branch error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
