"use client";

import { usePlatformUser } from "@/hooks/usePlatformUser";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LOGOUT } from "@/utils/APIConstant";
import { postApi } from "@/utils/common";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CreditCard,
  Headphones,
  LayoutDashboard,
  LogOut,
  Puzzle,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { ErrorsUnreadBadge, SupportUnreadBadge } from "@/components/notifications/SupportUnreadBadge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

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
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const performLogout = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    setLoggingOut(true);
    try {
      await postApi({ url: LOGOUT });
    } catch {
      // API алдаа гарсан ч локал төлөв цэвэрлээд login руу шилжинэ
    } finally {
      window.location.href = "/login";
    }
  }, []);

  return (
    <>
      <aside className="flex min-h-svh w-[260px] shrink-0 flex-col bg-[#0f172a] text-slate-300">
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
              {item.href === "/platform/support" ? (
                <SupportUnreadBadge className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white" />
              ) : null}
              {item.href === "/platform/errors" ? (
                <ErrorsUnreadBadge className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white" />
              ) : null}
            </Link>
          );
        })}
        </nav>

        <div className="mt-auto border-t border-white/10">
          <div className="p-4 pb-3">
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

          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="truncate">Гарах</span>
            </button>
          </div>
        </div>
      </aside>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Системээс гарах уу?</DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={loggingOut}
              onClick={() => setLogoutOpen(false)}
            >
              Цуцлах
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={loggingOut}
              onClick={() => void performLogout()}
            >
              {loggingOut ? "Гарч байна..." : "Гарах"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
