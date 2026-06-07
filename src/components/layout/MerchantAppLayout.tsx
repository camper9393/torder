"use client"

import { useCallback, useEffect, useState } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "@/components/SideBar"

const SIDEBAR_OPEN_STORAGE_KEY = "qr-menu-sidebar-open"

function readStoredSidebarOpen(): boolean {
  if (typeof window === "undefined") return true
  const stored = localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY)
  if (stored === "true") return true
  if (stored === "false") return false
  return true
}

export default function MerchantAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setOpen(readStoredSidebarOpen())
    setHydrated(true)
  }, [])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, String(nextOpen))
  }, [])

  return (
    <SidebarProvider
      open={hydrated ? open : true}
      onOpenChange={handleOpenChange}
    >
      <AppSidebar />
      <SidebarInset className="min-h-svh overflow-y-auto">
        <div className="w-full flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
