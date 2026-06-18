import {
  requireSettingsAccess,
  resolveSettingsRestaurantIdFromRequest,
} from "@/lib/settingsAuth";
import {
  createBranch,
  listBranches,
} from "@/service/settings/branchService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireSettingsAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveSettingsRestaurantIdFromRequest(req, auth);
  if (restaurantId instanceof Response) return restaurantId;

  try {
    const data = await listBranches(restaurantId);
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET branches error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSettingsAccess(req);
  if (auth instanceof Response) return auth;

  const restaurantId = await resolveSettingsRestaurantIdFromRequest(req, auth);
  if (restaurantId instanceof Response) return restaurantId;

  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return sendRJResponse({
        success: false,
        message: "Салбарын нэр оруулна уу",
        status: 400,
      });
    }
    const data = await createBranch(restaurantId, body);
    return sendRJResponse({
      success: true,
      message: "Салбар нэмэгдлээ",
      status: 201,
      data,
    });
  } catch (error) {
    console.error("POST branch error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
