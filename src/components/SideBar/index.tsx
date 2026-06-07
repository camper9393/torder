"use client"

import { useCallback, useMemo, type ComponentType } from "react"
import {
  LayoutDashboard,
  Utensils,
  QrCode,
  ShoppingBag,
  BarChart3,
  Home,
  LayoutGrid,
  ChefHat,
  Phone,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAppSelector } from "@/hook/redux"
import { useLocale } from "@/context/LocaleContext"
import { postApi } from "@/utils/common"
import { LOGOUT } from "@/utils/APIConstant"
type NavItem = {
  title: string
  url: string
  icon: ComponentType<{ className?: string }>
  isActive: (pathname: string) => boolean
}

export default function AppSidebar() {
  const pathname = usePathname() ?? ""
  const merchantId = useAppSelector((state) => state.merchant).merchant?._id
  const uid = useAppSelector((state) => state.merchant).merchant?.uid
  const { t } = useLocale()
  const n = t.nav

  const dashboardUrl = useMemo(
    () =>
      merchantId && uid
        ? `/dashboard/${merchantId}?uid=${uid}`
        : "/dashboard",
    [merchantId, uid]
  )

  const ordersUrl = useMemo(
    () =>
      merchantId && uid
        ? `/dashboard/${merchantId}/order?uid=${uid}`
        : "/dashboard",
    [merchantId, uid]
  )

  const navItems: NavItem[] = useMemo(() => [
    {
      title: n.home,
      url: "/",
      icon: Home,
      isActive: (p) => p === "/",
    },
    {
      title: n.dashboard,
      url: dashboardUrl,
      icon: LayoutDashboard,
      isActive: (p) =>
        !!merchantId &&
        (p === `/dashboard/${merchantId}` ||
          p.startsWith(`/dashboard/${merchantId}?`)),
    },
    {
      title: n.adminDashboard,
      url: "/admin/dashboard",
      icon: BarChart3,
      isActive: (p) =>
        p === "/admin/dashboard" || p.startsWith("/admin/dashboard/"),
    },
    {
      title: t.adminNav.tables,
      url: "/admin/tables",
      icon: LayoutGrid,
      isActive: (p) => p === "/admin/tables" || p.startsWith("/admin/tables/"),
    },
    {
      title: n.menu,
      url: "/menu",
      icon: Utensils,
      isActive: (p) => p === "/menu" || p.startsWith("/menu/"),
    },
    {
      title: n.qrManager,
      url: "/qr-manager",
      icon: QrCode,
      isActive: (p) => p === "/qr-manager" || p.startsWith("/qr-manager/"),
    },
    {
      title: n.orders,
      url: ordersUrl,
      icon: ShoppingBag,
      isActive: (p) =>
        !!merchantId && p.startsWith(`/dashboard/${merchantId}/order`),
    },
    {
      title: n.kitchen,
      url: "/kitchen",
      icon: ChefHat,
      isActive: (p) => p === "/kitchen" || p.startsWith("/kitchen/"),
    },
    {
      title: n.contact,
      url: "/",
      icon: Phone,
      isActive: () => false,
    },
  ], [
    n.home,
    n.dashboard,
    n.adminDashboard,
    n.menu,
    n.qrManager,
    n.orders,
    n.kitchen,
    n.contact,
    t.adminNav.tables,
    dashboardUrl,
    ordersUrl,
    merchantId,
  ])

  const handleLogOut = useCallback(async () => {
    if (typeof window === "undefined") return
    await postApi({ url: LOGOUT })
    window.location.href = "/"
  }, [])

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-slate-200">
      <SidebarHeader className="border-b border-slate-200 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-1 text-xl font-bold tracking-tight group-data-[collapsible=icon]:justify-center"
        >
          <span className="text-[#A18D6D]">QR</span>
          <span className="group-data-[collapsible=icon]:hidden">Menu</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = item.isActive(pathname)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="min-h-11 text-base touch-manipulation data-[active=true]:bg-slate-900 data-[active=true]:text-white data-[active=true]:hover:bg-slate-800 data-[active=true]:hover:text-white"
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-slate-200 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              onClick={handleLogOut}
              tooltip={n.logout}
              className="min-h-11 w-full text-base text-red-600 hover:bg-red-50 hover:text-red-700 touch-manipulation"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>{n.logout}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
