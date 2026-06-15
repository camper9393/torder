"use client"

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react"
import {
  BarChart3,
  ChevronDown,
  Circle,
  FileText,
  Home,
  LogOut,
  Package,
  PanelsTopLeft,
  Receipt,
  RotateCcw,
  Tablet,
  Truck,
  Utensils,
  CookingPot,
  BadgePercent,
  BarChart2,
  History,
  Users,
  CircleHelp,
  Settings,
  User,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useLocale } from "@/context/LocaleContext"
import { postApi } from "@/utils/common"
import { LOGOUT } from "@/utils/APIConstant"
import { cn } from "@/lib/utils"
import { canAccessSidebarNav, type SidebarNavKey } from "@/lib/sidebarPermissions"
import { useSidebarUser } from "@/hooks/useSidebarUser"
import { usePosRestaurantContext } from "@/hooks/usePosRestaurantContext"
import { usePlatformSupportMode } from "@/hooks/usePlatformSupportMode"
import SidebarHoverExpand from "./SidebarHoverExpand"
import { SidebarNavItem } from "./SidebarNavItem"
import { POST_PLATFORM_RESTAURANT_EXIT_SYSTEM } from "@/utils/APIConstant"

const SIDEBAR_LOGO_CANDIDATES = [
  "/img/Torder%20LOGO.png",
  "/img/logo.png",
] as const

const MENU_BTN_CLASS =
  "min-h-11 text-base touch-manipulation hover:bg-slate-100 data-[active=true]:bg-slate-900 data-[active=true]:text-white data-[active=true]:hover:bg-slate-800 data-[active=true]:hover:text-white"

/** Compact centered icon buttons when sidebar is collapsed */
const MENU_BTN_COLLAPSED_CLASS =
  "group-data-[collapsible=icon]:!size-11 group-data-[collapsible=icon]:!min-h-0 group-data-[collapsible=icon]:!h-11 group-data-[collapsible=icon]:!w-11 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"

const LABEL_COLLAPSED_CLASS =
  "group-data-[collapsible=icon]:!hidden group-data-[collapsible=icon]:!w-0 group-data-[collapsible=icon]:!min-w-0 group-data-[collapsible=icon]:!flex-none"

const LINK_COLLAPSED_CLASS =
  "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"

const SUBMENU_BTN_CLASS =
  "min-h-8 touch-manipulation hover:bg-slate-100 data-[active=true]:bg-slate-900 data-[active=true]:text-white data-[active=true]:hover:bg-slate-800"

const UTILITY_BTN_CLASS =
  "min-h-0 h-8 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 touch-manipulation data-[active=true]:bg-slate-100 data-[active=true]:font-medium data-[active=true]:text-slate-900"

const UTILITY_BTN_COLLAPSED_CLASS =
  "group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!h-8 group-data-[collapsible=icon]:!w-8 group-data-[collapsible=icon]:!min-h-0 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"

const UTILITY_NAV_ITEMS: NavItem[] = [
  {
    navKey: "help",
    title: "Тусламж",
    url: "/admin/help",
    icon: CircleHelp,
    isActive: (p) => matchPath(p, "/admin/help"),
  },
  {
    navKey: "staff",
    title: "Ажилтан",
    url: "/admin/staff",
    icon: Users,
    isActive: (p) => matchPath(p, "/admin/staff"),
  },
  {
    navKey: "settings",
    title: "Тохиргоо",
    url: "/admin/settings",
    icon: Settings,
    isActive: (p) => matchPath(p, "/admin/settings"),
  },
  {
    navKey: "profile",
    title: "Хэрэглэгч",
    url: "/admin/profile",
    icon: User,
    isActive: (p) => matchPath(p, "/admin/profile"),
  },
]

type NavItem = {
  navKey: SidebarNavKey
  title: string
  url: string
  icon: ComponentType<{ className?: string }>
  isActive: (pathname: string) => boolean
}

type ReportNavItem = {
  title: string
  url: string
  icon: ComponentType<{ className?: string }>
}

const REPORT_NAV_ITEMS: ReportNavItem[] = [
  { title: "Борлуулалтын тайлан", url: "/admin/reports/sales", icon: FileText },
  {
    title: "Захиалгын түүх",
    url: "/admin/reports/order-history",
    icon: History,
  },
  { title: "Буцаалт", url: "/admin/reports/refunds", icon: RotateCcw },
  { title: "Нэгдсэн тайлан", url: "/admin/reports/summary", icon: Circle },
  {
    title: "Бүтээгдэхүүн борлуулалт",
    url: "/admin/reports/products",
    icon: BarChart2,
  },
  {
    title: "Гүйлгээний тайлан",
    url: "/admin/reports/transactions",
    icon: Receipt,
  },
  {
    title: "Гал тогооны тайлан",
    url: "/admin/reports/kitchen",
    icon: CookingPot,
  },
  {
    title: "Зөөгчийн тайлан",
    url: "/admin/reports/waiters",
    icon: Users,
  },
  { title: "НӨАТ", url: "/admin/reports/vat", icon: BadgePercent },
]

function matchPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`)
}

export default function AppSidebar() {
  const pathname = usePathname() ?? ""
  const { state, setOpen, isMobile } = useSidebar()
  const { t } = useLocale()
  const { user } = useSidebarUser()
  const { hasPosRestaurantContext } = usePosRestaurantContext()
  const { isSupportMode, support } = usePlatformSupportMode()
  const [exitingSupport, setExitingSupport] = useState(false)
  const n = t.nav
  const sidebarExpanded = state === "expanded"
  const [logoCandidateIndex, setLogoCandidateIndex] = useState(0)
  const logoSrc = SIDEBAR_LOGO_CANDIDATES[logoCandidateIndex] ?? SIDEBAR_LOGO_CANDIDATES[0]

  const reportsActive = pathname.startsWith("/admin/reports")
  const reportsAllowed = canAccessSidebarNav(user, "reports", {
    hasPosRestaurantContext,
  })
  const [reportsOpen, setReportsOpen] = useState(reportsActive)

  useEffect(() => {
    if (reportsActive && reportsAllowed) setReportsOpen(true)
  }, [reportsActive, reportsAllowed])

  const handleLogoError = useCallback(() => {
    setLogoCandidateIndex((prev) => {
      const next = prev + 1
      if (next < SIDEBAR_LOGO_CANDIDATES.length) return next
      return prev
    })
  }, [])

  const navItems: NavItem[] = useMemo(
    () => [
      {
        navKey: "dashboard",
        title: "Нүүр",
        url: "/admin/dashboard",
        icon: Home,
        isActive: (p) => matchPath(p, "/admin/dashboard"),
      },
      {
        navKey: "tables",
        title: "Үйлчилгээний самбар",
        url: "/admin/tables",
        icon: PanelsTopLeft,
        isActive: (p) => matchPath(p, "/admin/tables"),
      },
      {
        navKey: "delivery",
        title: "Хүргэлт",
        url: "/admin/delivery",
        icon: Truck,
        isActive: (p) => matchPath(p, "/admin/delivery"),
      },
      {
        navKey: "menu",
        title: "Цэс",
        url: "/menu",
        icon: Utensils,
        isActive: (p) => matchPath(p, "/menu"),
      },
      {
        navKey: "inventory",
        title: "Inventory",
        url: "/inventory",
        icon: Package,
        isActive: (p) =>
          matchPath(p, "/inventory") || matchPath(p, "/admin/inventory"),
      },
      {
        navKey: "tablet-order",
        title: "Tablet order",
        url: "/admin/tablet-order",
        icon: Tablet,
        isActive: (p) => matchPath(p, "/admin/tablet-order"),
      },
      {
        navKey: "kitchen",
        title: "Гал тогоо",
        url: "/admin/kitchen",
        icon: CookingPot,
        isActive: (p) =>
          matchPath(p, "/admin/kitchen") || matchPath(p, "/kitchen"),
      },
    ],
    []
  )

  const handleLogOut = useCallback(async () => {
    if (typeof window === "undefined") return
    await postApi({ url: LOGOUT })
    window.location.href = "/login"
  }, [])

  const handleExitSupport = useCallback(async () => {
    if (typeof window === "undefined") return
    setExitingSupport(true)
    try {
      await postApi({ url: POST_PLATFORM_RESTAURANT_EXIT_SYSTEM })
    } catch {
      // support контекст цэвэрлээд platform руу буцна
    } finally {
      window.location.href = "/platform/restaurants"
    }
  }, [])

  const logoNavActive = pathname === "/"

  const handleReportsToggle = useCallback(() => {
    if (!reportsAllowed) return
    if (!sidebarExpanded && !isMobile) {
      setOpen(true)
      setReportsOpen(true)
      return
    }
    setReportsOpen((open) => !open)
  }, [isMobile, reportsAllowed, setOpen, sidebarExpanded])

  return (
    <>
      <SidebarHoverExpand />
      <Sidebar
        collapsible="icon"
        className="border-r border-slate-200 [&_[data-slot=sidebar-container]]:transition-[width] [&_[data-slot=sidebar-container]]:duration-300 [&_[data-slot=sidebar-container]]:ease-in-out [&_[data-slot=sidebar-gap]]:transition-[width] [&_[data-slot=sidebar-gap]]:duration-300 [&_[data-slot=sidebar-gap]]:ease-in-out"
      >
      <SidebarContent className="px-2 py-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
        <SidebarGroup className="p-2 group-data-[collapsible=icon]:p-0">
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1.5">
              <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton
                  asChild
                  isActive={logoNavActive}
                  tooltip="TOrder"
                  className={cn(MENU_BTN_CLASS, MENU_BTN_COLLAPSED_CLASS)}
                >
                  <Link
                    href="/"
                    className={cn(
                      "flex w-full items-center justify-start gap-3 overflow-hidden",
                      LINK_COLLAPSED_CLASS
                    )}
                  >
                    <Image
                      src={logoSrc}
                      alt="TOrder"
                      width={64}
                      height={26}
                      onError={handleLogoError}
                      className={cn(
                        "shrink-0 object-contain [image-rendering:-webkit-optimize-contrast] transition-all duration-300",
                        sidebarExpanded
                          ? "h-7 w-auto max-w-[4rem] object-left"
                          : "h-7 w-7 object-center"
                      )}
                      priority
                    />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {navItems.map((item) => (
                <SidebarNavItem
                  key={item.navKey}
                  navKey={item.navKey}
                  user={user}
                  hasPosRestaurantContext={hasPosRestaurantContext}
                  title={item.title}
                  href={item.url}
                  isActive={item.isActive(pathname)}
                  icon={item.icon}
                  itemClassName="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                  menuButtonClassName={cn(MENU_BTN_CLASS, MENU_BTN_COLLAPSED_CLASS)}
                  linkClassName={cn("flex items-center gap-3", LINK_COLLAPSED_CLASS)}
                  labelClassName={cn(
                    "truncate transition-opacity duration-200",
                    LABEL_COLLAPSED_CLASS,
                    sidebarExpanded ? "opacity-100" : "opacity-0"
                  )}
                />
              ))}

              <SidebarNavItem
                navKey="reports"
                user={user}
                hasPosRestaurantContext={hasPosRestaurantContext}
                title="Тайлан"
                isActive={reportsActive}
                icon={BarChart3}
                asButton
                onClick={handleReportsToggle}
                itemClassName="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                menuButtonClassName={cn(MENU_BTN_CLASS, MENU_BTN_COLLAPSED_CLASS)}
                label={
                  <>
                    <span
                      className={cn(
                        "flex-1 truncate text-left transition-opacity duration-200",
                        LABEL_COLLAPSED_CLASS,
                        sidebarExpanded ? "opacity-100" : "opacity-0"
                      )}
                    >
                      Тайлан
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 opacity-70 transition-transform duration-200",
                        reportsOpen && reportsAllowed && "rotate-180",
                        !sidebarExpanded && "hidden"
                      )}
                    />
                  </>
                }
              >
                {reportsOpen && reportsAllowed ? (
                  <SidebarMenuSub>
                    {REPORT_NAV_ITEMS.map((item) => {
                      const active =
                        matchPath(pathname, item.url) ||
                        (item.url === "/admin/reports/sales" &&
                          pathname === "/admin/reports/orders")
                      return (
                        <SidebarMenuSubItem key={item.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={active}
                            className={SUBMENU_BTN_CLASS}
                          >
                            <Link
                              href={item.url}
                              className="flex items-center gap-2"
                            >
                              <item.icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                ) : null}
              </SidebarNavItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-2">
        {isSupportMode && support ? (
          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 group-data-[collapsible=icon]:hidden">
            <p className="text-[11px] font-medium leading-snug text-amber-900">
              Support mode:
              <span className="mt-0.5 block truncate font-semibold">
                {support.restaurantName}
              </span>
            </p>
            <button
              type="button"
              disabled={exitingSupport}
              onClick={() => void handleExitSupport()}
              className="mt-2 w-full rounded-md border border-amber-300 bg-white px-2 py-1.5 text-xs font-medium text-amber-950 transition hover:bg-amber-100 disabled:opacity-60"
            >
              {exitingSupport ? "Гарч байна..." : "Ресторанаас гарах"}
            </button>
          </div>
        ) : null}
        <div className="border-t border-slate-200 pt-1.5">
          <SidebarMenu className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-0.5">
            {UTILITY_NAV_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.navKey}
                navKey={item.navKey}
                user={user}
                hasPosRestaurantContext={hasPosRestaurantContext}
                title={item.title}
                href={item.url}
                isActive={item.isActive(pathname)}
                icon={item.icon}
                iconClassName="h-4 w-4 shrink-0 opacity-80"
                itemClassName="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                menuButtonClassName={cn(UTILITY_BTN_CLASS, UTILITY_BTN_COLLAPSED_CLASS)}
                linkClassName={cn("flex items-center gap-2", LINK_COLLAPSED_CLASS)}
                labelClassName={cn(
                  "truncate transition-opacity duration-200",
                  LABEL_COLLAPSED_CLASS,
                  sidebarExpanded ? "opacity-100" : "opacity-0"
                )}
              />
            ))}
          </SidebarMenu>
        </div>

        <SidebarMenu className="mt-1 group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              type="button"
              onClick={handleLogOut}
              tooltip={n.logout}
              className={cn(
                "min-h-11 w-full text-base text-red-600 hover:bg-red-50 hover:text-red-700 touch-manipulation",
                MENU_BTN_COLLAPSED_CLASS
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span
                className={cn(
                  "truncate transition-opacity duration-200",
                  LABEL_COLLAPSED_CLASS,
                  sidebarExpanded ? "opacity-100" : "opacity-0"
                )}
              >
                {n.logout}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    </>
  )
}
