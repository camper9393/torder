"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "@/components/SideBar"
import AppTopBar from "@/components/layout/AppTopBar"
import PlatformSupportBanner from "@/components/layout/PlatformSupportBanner"
import PosRestaurantContextGate from "@/components/layout/PosRestaurantContextGate"

export default function MerchantAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      defaultOpen={false}
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="min-h-svh overflow-y-auto">
        <div className="w-full flex-1 p-4 md:p-6">
          <AppTopBar showSidebarTrigger />
          <PlatformSupportBanner />
          <PosRestaurantContextGate>{children}</PosRestaurantContextGate>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
