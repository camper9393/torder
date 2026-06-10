"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ChefHat,
  History,
  BarChart3,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/inventory", label: "Самбар", icon: LayoutDashboard, exact: true },
  { href: "/inventory/items", label: "Бараа", icon: Package, exact: false },
  { href: "/inventory/stock-in", label: "Орлого", icon: ArrowDownToLine, exact: false },
  { href: "/inventory/recipes", label: "Жор", icon: ChefHat, exact: false },
  { href: "/inventory/history", label: "Түүх", icon: History, exact: false },
  { href: "/inventory/reports", label: "Тайлан", icon: BarChart3, exact: false },
] as const

export default function InventoryNav() {
  const pathname = usePathname() ?? ""

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
