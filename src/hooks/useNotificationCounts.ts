"use client";

import React from "react";
import type { NotificationReadCategory } from "@/constants/notificationCategories";
import { subscribeNotificationsRefresh } from "@/lib/notificationRefresh";
import { GET_NOTIFICATIONS } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
import { markNotificationsReadByCategory } from "@/utils/notificationMarkRead";

export function useMarkNotificationsReadOnPage(category: NotificationReadCategory) {
  const markedRef = React.useRef(false);

  React.useEffect(() => {
    if (markedRef.current) return;
    markedRef.current = true;
    void markNotificationsReadByCategory(category);
  }, [category]);
}

export function useMarkSupportTicketNotificationsRead(
  ticketId: string | null,
  status: string | undefined
) {
  const lastMarkedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!ticketId || !status) return;
    const isDone = status === "resolved" || status === "closed";
    if (!isDone) return;
    if (lastMarkedRef.current === ticketId) return;

    lastMarkedRef.current = ticketId;
    void markNotificationsReadByCategory("support", ticketId);
  }, [ticketId, status]);
}

export function useNotificationCounts() {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = React.useState(0);
  const [unreadErrorsCount, setUnreadErrorsCount] = React.useState(0);

  const load = React.useCallback(async () => {
    const res = await getApi<{
      success: boolean;
      data?: {
        unreadCount?: number;
        unreadSupportCount?: number;
        unreadErrorsCount?: number;
      };
    }>({ url: GET_NOTIFICATIONS });
    if (res?.success && res.data) {
      setUnreadCount(res.data.unreadCount ?? 0);
      setUnreadSupportCount(res.data.unreadSupportCount ?? 0);
      setUnreadErrorsCount(res.data.unreadErrorsCount ?? 0);
    }
  }, []);

  React.useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 60_000);
    const unsubscribe = subscribeNotificationsRefresh(() => void load());
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [load]);

  return { unreadCount, unreadSupportCount, unreadErrorsCount, refresh: load };
}
