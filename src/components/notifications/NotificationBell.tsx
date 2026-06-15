"use client";

import React from "react";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useNotificationCounts } from "@/hooks/useNotificationCounts";
import { emitNotificationsRefresh } from "@/lib/notificationRefresh";
import {
  GET_NOTIFICATIONS,
  PATCH_NOTIFICATION_READ,
  POST_NOTIFICATIONS_READ_ALL,
} from "@/utils/APIConstant";
import { getApi, patchApi, postApi } from "@/utils/common";
import { markNotificationIdsRead } from "@/utils/notificationMarkRead";
import { cn } from "@/lib/utils";

type NotificationItem = {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: { ticketId?: string };
};

function formatBadge(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}

function notificationHref(item: NotificationItem): string | null {
  const ticketId = item.metadata?.ticketId;
  if (!ticketId) return null;
  return `/platform/support?ticket=${ticketId}`;
}

export default function NotificationBell() {
  const { unreadCount, refresh } = useNotificationCounts();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const loadItems = React.useCallback(async () => {
    setLoading(true);
    const res = await getApi<{
      success: boolean;
      data?: { items: NotificationItem[] };
    }>({ url: GET_NOTIFICATIONS });
    if (res?.success && res.data) {
      setItems(res.data.items);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadItems();
    const id = setInterval(() => void loadItems(), 60_000);
    return () => clearInterval(id);
  }, [loadItems]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const openPanel = async () => {
    setOpen(true);
    setLoading(true);
    const res = await getApi<{
      success: boolean;
      data?: { items: NotificationItem[] };
    }>({ url: GET_NOTIFICATIONS });
    setLoading(false);

    if (!res?.success || !res.data) return;

    const loaded = res.data.items;
    const unreadIds = loaded.filter((n) => !n.isRead).map((n) => n._id);
    setItems(loaded);

    if (unreadIds.length > 0) {
      await markNotificationIdsRead(unreadIds);
      setItems(loaded.map((n) => ({ ...n, isRead: true })));
      await refresh();
    }
  };

  const markAllRead = async () => {
    await postApi({ url: POST_NOTIFICATIONS_READ_ALL, values: { action: "read-all" } });
    emitNotificationsRefresh();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await refresh();
  };

  const markOneRead = async (id: string) => {
    await patchApi({ url: PATCH_NOTIFICATION_READ(id), values: {} });
    setItems((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    emitNotificationsRefresh();
    await refresh();
  };

  const badge = formatBadge(unreadCount);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          void openPanel();
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 touch-manipulation"
        aria-label="Мэдэгдэл"
      >
        <Bell className="h-5 w-5" />
        {badge ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1E5EFF] px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-900">Мэдэгдэл</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => void markAllRead()}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Бүгдийг уншсан
            </Button>
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Ачааллаж байна...</p>
            ) : null}
            {!loading && items.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Мэдэгдэл байхгүй</p>
            ) : null}
            {items.map((item) => {
              const href = notificationHref(item);
              const content = (
                <div
                  className={cn(
                    "border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50",
                    !item.isRead && "bg-blue-50/60"
                  )}
                >
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                    {item.message}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleString("mn-MN")}
                  </p>
                </div>
              );

              if (href) {
                return (
                  <Link
                    key={item._id}
                    href={href}
                    onClick={() => {
                      if (!item.isRead) void markOneRead(item._id);
                      setOpen(false);
                    }}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item._id}
                  type="button"
                  className="block w-full"
                  onClick={() => {
                    if (!item.isRead) void markOneRead(item._id);
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
