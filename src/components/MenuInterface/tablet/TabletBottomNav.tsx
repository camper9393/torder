"use client"

import React from "react"
import { useAppSelector } from "@/hook/redux"
import { cn } from "@/lib/utils"
import {
  Bell,
  Bot,
  ClipboardList,
  Gift,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import LanguageSwitcher from "@/components/common/LanguageSwitcher"
import { useLocale } from "@/context/LocaleContext"
import { useWaiterCallSubmit } from "@/hooks/useWaiterCallSubmit"
import {
  TORDER_BOTTOM_BAR_HEIGHT_PX,
  TORDER_SIDEBAR_WIDTH_PX,
} from "./tabletUi"
import { useTabletCartUiOptional } from "./useTabletCartUi"

type TabletBottomNavProps = {
  merchantId: string
  active?: "menu" | "checkout"
  hideCartOnDesktop?: boolean
  menuColumnOnlyOnDesktop?: boolean
  consumerMobileLayer?: boolean
  variant?: "paper" | "torder"
}

function TabletBottomNav({
  merchantId,
  active = "menu",
  hideCartOnDesktop = false,
  menuColumnOnlyOnDesktop = false,
  consumerMobileLayer = false,
  variant = "paper",
}: TabletBottomNavProps) {
  const router = useRouter()
  const { t } = useLocale()
  const tableName = useAppSelector((state) => state.checkOut.tableName)
  const cartCount = useAppSelector((state) =>
    state.checkOut.items.reduce((sum, i) => sum + i.itemCount, 0)
  )

  const cartUi = useTabletCartUiOptional()
  const { callingStaff, submitWaiterCall } = useWaiterCallSubmit(
    merchantId,
    tableName
  )

  const tableQuery = tableName
    ? `?table=${encodeURIComponent(tableName)}`
    : ""
  const menuPath = `/consumer/${merchantId}${tableQuery}`
  const checkoutPath = `/consumer/${merchantId}/checkout${tableQuery}`

  const navBtn =
    "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold text-[#8a7344] touch-manipulation active:scale-95 sm:text-xs"

  const handleCallStaff = () => {
    void submitWaiterCall()
  }

  const torderSecondaryBtn =
    "flex min-h-12 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-black touch-manipulation transition active:scale-[0.98] hover:bg-neutral-50"

  const torderPrimaryBtn =
    "flex min-h-12 min-w-[9.5rem] items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-bold text-white touch-manipulation transition active:scale-[0.98] hover:bg-neutral-900 sm:min-w-[10.5rem]"

  if (variant === "torder") {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white md:left-[var(--torder-sidebar-w)]"
        style={
          {
            "--torder-sidebar-w": `${TORDER_SIDEBAR_WIDTH_PX}px`,
            height: TORDER_BOTTOM_BAR_HEIGHT_PX,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          } as React.CSSProperties
        }
      >
        <div className="flex h-full items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={torderSecondaryBtn}
              onClick={() => toast(t.tablet.noticeMsg, { icon: "🎁" })}
            >
              <Gift className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{t.tablet.event}</span>
            </button>
            <div className={cn(torderSecondaryBtn, "px-3")}>
              <LanguageSwitcher compact className="!gap-1.5" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={torderPrimaryBtn}
              onClick={() => cartUi?.openHistory()}
            >
              <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{t.tablet.orderHistoryTitle}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (active === "menu" && cartUi) {
                  cartUi.openCart()
                  return
                }
                router.push(active === "checkout" ? menuPath : checkoutPath)
              }}
              className={torderPrimaryBtn}
            >
              <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">
                {cartCount > 0
                  ? t.tablet.cartTitleWithCount(
                      cartCount > 99 ? "99+" : String(cartCount)
                    )
                  : t.tablet.cart}
              </span>
            </button>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 border-t border-[#c9a227]/25 bg-[#121110]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md",
        consumerMobileLayer ? "z-[9998]" : "z-40",
        menuColumnOnlyOnDesktop && "xl:right-auto xl:w-[75%]"
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-stretch gap-1",
          menuColumnOnlyOnDesktop && "xl:max-w-none xl:w-full"
        )}
      >
        <button type="button" className={navBtn} onClick={() => toast(t.tablet.noticeMsg, { icon: "📢" })}>
          <Bell className="h-5 w-5 shrink-0 text-[#c9a227]" aria-hidden />
          <span className="truncate">{t.tablet.notice}</span>
        </button>

        <button type="button" className={navBtn} onClick={() => toast(t.tablet.historyMsg)}>
          <ClipboardList className="h-5 w-5 shrink-0 text-[#c9a227]" aria-hidden />
          <span className="truncate">{t.tablet.orderHistory}</span>
        </button>

        <button
          type="button"
          className={navBtn}
          disabled={callingStaff}
          onClick={handleCallStaff}
        >
          <UserRound className="h-5 w-5 shrink-0 text-[#c9a227]" aria-hidden />
          <span className="truncate">{t.tablet.callStaff}</span>
        </button>

        <button
          type="button"
          className={navBtn}
          onClick={() => toast(t.tablet.robotMsg, { icon: "🤖" })}
        >
          <Bot className="h-5 w-5 shrink-0 text-[#c9a227]" aria-hidden />
          <span className="truncate">{t.tablet.servingRobot}</span>
        </button>

        <button
          type="button"
          onClick={() =>
            router.push(active === "checkout" ? menuPath : checkoutPath)
          }
          className={cn(
            "relative ml-1 flex min-h-[3.25rem] min-w-[5.5rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#c9a227] px-3 text-xs font-bold shadow-lg touch-manipulation active:scale-95 sm:min-w-[6.5rem]",
            active === "checkout"
              ? "bg-[#8a7344] text-[#f3e8cf]"
              : "bg-gradient-to-b from-[#c9a227] to-[#8a7344] text-[#121110]",
            hideCartOnDesktop && "xl:hidden"
          )}
        >
          <ShoppingCart className="h-5 w-5" aria-hidden />
          <span>{t.tablet.cart}</span>
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white ring-2 ring-[#121110]">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}

export default TabletBottomNav
