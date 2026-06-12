"use client"

import { usePathname } from "next/navigation"
import { usesMerchantSidebar, usesPlatformSidebar } from "@/utils/routes"
import MerchantAppLayout from "@/components/layout/MerchantAppLayout"
import PlatformAppLayout from "@/components/layout/PlatformAppLayout"

/** One sidebar shell for all merchant routes (avoids remounting per nested layout). */
export default function AppChrome({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  if (usesPlatformSidebar(pathname)) {
    return <PlatformAppLayout>{children}</PlatformAppLayout>
  }

  if (usesMerchantSidebar(pathname)) {
    return <MerchantAppLayout>{children}</MerchantAppLayout>
  }

  return <main className="flex-1">{children}</main>
}
