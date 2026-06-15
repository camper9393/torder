"use client";

import AppTopBar from "@/components/layout/AppTopBar";
import PlatformSidebar from "@/components/Platform/PlatformSidebar";

export default function PlatformAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh bg-[#f1f5f9]">
      <PlatformSidebar />
      <div className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-[1440px] p-5 md:p-8">
          <AppTopBar showNotificationBell />
          {children}
        </div>
      </div>
    </div>
  );
}
