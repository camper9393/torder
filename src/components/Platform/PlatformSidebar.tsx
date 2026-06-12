"use client";

import { usePlatformUser } from "@/hooks/usePlatformUser";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CreditCard,
  Headphones,
  LayoutDashboard,
  Puzzle,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/platform/dashboard", label: "Хянах самбар", icon: LayoutDashboard },
  { href: "/platform/restaurants", label: "Ресторанууд", icon: Building2 },
  { href: "/platform/users", label: "Хэрэглэгчид", icon: Users },
  { href: "/platform/roles", label: "Роль, эрх", icon: Shield },
  { href: "/platform/payments", label: "Төлбөр, тооцоо", icon: CreditCard },
  { href: "/platform/support", label: "Зөвлөгөө, Support", icon: Headphones },
  { href: "/platform/errors", label: "Системийн алдаа", icon: AlertTriangle },
  { href: "/platform/reports", label: "Тайлан, статистик", icon: BarChart3 },
  { href: "/platform/modules", label: "Модулиуд", icon: Puzzle },
  { href: "/platform/settings", label: "Тохиргоо", icon: Settings },
  { href: "/platform/activity", label: "Activity log", icon: Activity },
] as const;

export default function PlatformSidebar() {
  const pathname = usePathname() ?? "";
  const user = usePlatformUser();

  return (
    <aside className="flex w-[260px] shrink-0 flex-col bg-[#0f172a] text-slate-300">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            OA
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Order Admin</p>
            <p className="text-xs text-blue-400">Super Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            {(user?.name?.charAt(0) || user?.username?.charAt(0) || "A").toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user?.name || user?.username || "Admin"}
            </p>
            <p className="truncate text-xs text-slate-400">
              {user?.email || "super@order.com"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
