"use client"

import React from "react"
import { useAppSelector } from "@/hook/redux"
import { cn } from "@/lib/utils"
import {
  Bell,
  Bot,
  ClipboardList,
  ShoppingCart,
  UserRound,
} from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { POST_WAITER_CALL } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { postApi } from "@/utils/common"
import { tabletCopy, TabletLocale } from "./tabletUi"

type TabletBottomNavProps = {
  merchantId: string
  locale: TabletLocale
  active?: "menu" | "checkout"
}

function TabletBottomNav({
  merchantId,
  locale,
  active = "menu",
}: TabletBottomNavProps) {
  const router = useRouter()
  const copy = tabletCopy[locale]
  const tableName = useAppSelector((state) => state.checkOut.tableName)
  const cartCount = useAppSelector((state) =>
    state.checkOut.items.reduce((sum, i) => sum + i.itemCount, 0)
  )

  const tableQuery = `?table=${encodeURIComponent(tableName)}`
  const menuPath = `/consumer/${merchantId}${tableQuery}`
  const checkoutPath = `/consumer/${merchantId}/checkout${tableQuery}`

  const navBtn =
    "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold text-gray-500 touch-manipulation active:scale-95 sm:text-xs"

  const [callingStaff, setCallingStaff] = React.useState(false)

  const handleCallStaff = async () => {
    if (callingStaff) return
    setCallingStaff(true)

    const res = await postApi<ApiResponse<unknown>>({
      url: POST_WAITER_CALL,
      values: { merchantId, tableName },
    })

    setCallingStaff(false)

    if (res?.success) {
      toast.success(copy.staffCalled)
    } else {
      toast.error(res?.message || copy.staffCallFailed)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#d4ddf0] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-stretch gap-1">
        <button
          type="button"
          className={navBtn}
          onClick={() => toast(copy.noticeMsg, { icon: "📢" })}
        >
          <Bell className="h-5 w-5 shrink-0" aria-hidden />
          <span className="truncate">{copy.notice}</span>
        </button>

        <button
          type="button"
          className={navBtn}
          onClick={() => toast(copy.historyMsg)}
        >
          <ClipboardList className="h-5 w-5 shrink-0" aria-hidden />
          <span className="truncate">{copy.orderHistory}</span>
        </button>

        <button
          type="button"
          className={navBtn}
          disabled={callingStaff}
          onClick={handleCallStaff}
        >
          <UserRound className="h-5 w-5 shrink-0" aria-hidden />
          <span className="truncate">{copy.callStaff}</span>
        </button>

        <button
          type="button"
          className={navBtn}
          onClick={() => toast(copy.robotMsg, { icon: "🤖" })}
        >
          <Bot className="h-5 w-5 shrink-0" aria-hidden />
          <span className="truncate">{copy.servingRobot}</span>
        </button>

        <button
          type="button"
          onClick={() =>
            router.push(active === "checkout" ? menuPath : checkoutPath)
          }
          className={cn(
            "relative ml-1 flex min-h-[3.25rem] min-w-[5.5rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-3 text-xs font-bold text-white shadow-lg touch-manipulation active:scale-95 sm:min-w-[6.5rem]",
            active === "checkout"
              ? "bg-[#1548D4]"
              : "bg-[#1E5EFF]"
          )}
        >
          <ShoppingCart className="h-5 w-5" aria-hidden />
          <span>{copy.cart}</span>
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white ring-2 ring-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}

export default TabletBottomNav
