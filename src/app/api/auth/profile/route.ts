import { requireAuth } from "@/lib/auth";
import { User } from "@/model/user";
import {
  buildProfileView,
  updateOwnProfile,
} from "@/service/profileService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

const FORBIDDEN_PROFILE_FIELDS = [
  "username",
  "role",
  "restaurantId",
  "permissions",
  "isActive",
  "passwordHash",
  "password",
  "_id",
  "id",
] as const;

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const profile = await buildProfileView(authResult);
    return sendRJResponse({
      success: true,
      message: "Профайл амжилттай татагдлаа",
      data: profile,
    });
  } catch (error) {
    console.error("GET /api/auth/profile error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await req.json();

    for (const field of FORBIDDEN_PROFILE_FIELDS) {
      if (field in body && body[field] !== undefined) {
        return sendRJResponse({
          success: false,
          message: `${field} талбарыг өөрчлөх боломжгүй`,
          status: 400,
        });
      }
    }

    const name = typeof body.name === "string" ? body.name : undefined;
    const email = typeof body.email === "string" ? body.email : undefined;

    if (name === undefined && email === undefined) {
      return sendRJResponse({
        success: false,
        message: "Шинэчлэх талбар олдсонгүй",
        status: 400,
      });
    }

    await updateOwnProfile(authResult._id, { name, email });

    const freshUser = await User.findById(authResult._id);
    if (!freshUser) {
      return sendRJResponse({
        success: false,
        message: "Хэрэглэгч олдсонгүй",
        status: 404,
      });
    }

    const profile = await buildProfileView(freshUser);

    return sendRJResponse({
      success: true,
      message: "Профайл амжилттай шинэчлэгдлээ",
      data: profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    console.error("PATCH /api/auth/profile error:", error);
    return sendRJResponse({
      success: false,
      message,
      status: 400,
    });
  }
}
