import { requirePlatformOwner } from "@/lib/auth";
import { NOTIFICATION_TYPES_BY_CATEGORY } from "@/constants/notificationCategories";
import {
  countUnreadErrorsForUser,
  countUnreadForUser,
  countUnreadSupportForUser,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationsReadByFilter,
  markNotificationsReadByIds,
  type MarkNotificationsReadOptions,
} from "@/service/notificationService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";
import { UserRole } from "@/model/user";

export async function GET(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const [items, unreadCount, unreadSupportCount, unreadErrorsCount] =
      await Promise.all([
        listNotificationsForUser(authResult._id),
        countUnreadForUser(authResult._id),
        countUnreadSupportForUser(authResult._id, UserRole.PLATFORM_OWNER),
        countUnreadErrorsForUser(authResult._id),
      ]);
    return sendRJResponse({
      success: true,
      message: "Амжилттай",
      data: { items, unreadCount, unreadSupportCount, unreadErrorsCount },
    });  } catch (error) {
    console.error("GET /api/notifications error:", error);
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
    if (body.action === "read-all") {
      const count = await markAllNotificationsRead(authResult._id);
      return sendRJResponse({
        success: true,
        message: "Бүгдийг уншсан болголоо",
        data: { count },
      });
    }

    if (body.action === "read-by-category") {
      const category = body.category as keyof typeof NOTIFICATION_TYPES_BY_CATEGORY;
      const types = NOTIFICATION_TYPES_BY_CATEGORY[category];
      if (!types?.length) {
        return sendRJResponse({
          success: false,
          message: "Буруу ангилал",
          status: 400,
        });
      }

      const options: MarkNotificationsReadOptions = { types };
      if (typeof body.ticketId === "string" && body.ticketId.trim()) {
        options.ticketId = body.ticketId.trim();
      }

      const count = await markNotificationsReadByFilter(authResult._id, options);
      return sendRJResponse({
        success: true,
        message: "Уншсан болголоо",
        data: { count },
      });
    }

    if (body.action === "read-by-ids") {
      const ids = Array.isArray(body.ids)
        ? body.ids.filter((id: unknown): id is string => typeof id === "string")
        : [];
      const count = await markNotificationsReadByIds(authResult._id, ids);
      return sendRJResponse({
        success: true,
        message: "Уншсан болголоо",
        data: { count },
      });
    }
    return sendRJResponse({
      success: false,
      message: "Буруу үйлдэл",
      status: 400,
    });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
