"use client"

import { usePathname } from "next/navigation"
import ReportsPrimaryNav from "@/components/Admin/Reports/ReportsPrimaryNav"

export default function AdminReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? ""
  const showPrimaryNav = pathname.startsWith("/admin/reports")

  return (
    <>
      {showPrimaryNav ? <ReportsPrimaryNav /> : null}
      {children}
    </>
  )
}
