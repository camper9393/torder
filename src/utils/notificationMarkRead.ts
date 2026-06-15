import type { NotificationReadCategory } from "@/constants/notificationCategories";
import { emitNotificationsRefresh } from "@/lib/notificationRefresh";
import { POST_NOTIFICATIONS_READ_ALL } from "@/utils/APIConstant";
import { postApi } from "@/utils/common";

export async function markNotificationsReadByCategory(
  category: NotificationReadCategory,
  ticketId?: string
) {
  const res = await postApi<{ success: boolean }>({
    url: POST_NOTIFICATIONS_READ_ALL,
    values: {
      action: "read-by-category",
      category,
      ...(ticketId ? { ticketId } : {}),
    },
  });
  if (res?.success) {
    emitNotificationsRefresh();
  }
  return res?.success ?? false;
}

export async function markNotificationIdsRead(ids: string[]) {
  if (ids.length === 0) return false;
  const res = await postApi<{ success: boolean }>({
    url: POST_NOTIFICATIONS_READ_ALL,
    values: { action: "read-by-ids", ids },
  });
  if (res?.success) {
    emitNotificationsRefresh();
  }
  return res?.success ?? false;
}
