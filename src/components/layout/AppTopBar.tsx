"use client";

import NotificationBell from "@/components/notifications/NotificationBell";
import { SidebarTrigger } from "@/components/ui/sidebar";

type AppTopBarProps = {
  showSidebarTrigger?: boolean;
  showNotificationBell?: boolean;
};

export default function AppTopBar({
  showSidebarTrigger = false,
  showNotificationBell = false,
}: AppTopBarProps) {
  if (!showSidebarTrigger && !showNotificationBell) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center justify-end gap-2">
      {showSidebarTrigger ? (
        <SidebarTrigger className="mr-auto h-11 w-11 touch-manipulation md:hidden" />
      ) : null}
      {showNotificationBell ? <NotificationBell /> : null}
    </div>
  );
}