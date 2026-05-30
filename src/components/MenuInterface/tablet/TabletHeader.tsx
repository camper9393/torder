"use client"

import React from "react"
import { Globe } from "lucide-react"
import { formatTableLabel, getSessionOrderNumber } from "@/utils/tabletSession"
import { tabletCopy, TabletLocale } from "./tabletUi"

type TabletHeaderProps = {
  restaurantName: string
  tableName: string
  merchantId: string
  locale: TabletLocale
  onToggleLocale: () => void
}

function TabletHeader({
  restaurantName,
  tableName,
  merchantId,
  locale,
  onToggleLocale,
}: TabletHeaderProps) {
  const copy = tabletCopy[locale]
  const [orderNo, setOrderNo] = React.useState(1)

  React.useEffect(() => {
    const refresh = () => setOrderNo(getSessionOrderNumber(merchantId))
    refresh()

    const onBump = (e: Event) => {
      const detail = (e as CustomEvent<{ merchantId: string }>).detail
      if (detail?.merchantId === merchantId) refresh()
    }

    window.addEventListener("tablet-order-bump", onBump)
    window.addEventListener("focus", refresh)
    return () => {
      window.removeEventListener("tablet-order-bump", onBump)
      window.removeEventListener("focus", refresh)
    }
  }, [merchantId])

  const initial = restaurantName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-[4.25rem] shrink-0 items-center gap-3 border-b border-[#d4ddf0] bg-white px-4 shadow-sm">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
        style={{ background: "linear-gradient(135deg, #1E5EFF 0%, #1548D4 100%)" }}
        aria-hidden
      >
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-gray-900">{restaurantName}</p>
        <p className="text-xs font-semibold tracking-wide text-[#1E5EFF]">
          {formatTableLabel(tableName)}
        </p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
          {copy.orderNo}
        </p>
        <p className="text-sm font-bold text-gray-800">
          #{String(orderNo).padStart(3, "0")}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggleLocale}
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-full border border-[#c5d4f5] bg-[#f0f4fc] px-3 text-xs font-semibold text-[#1E5EFF] touch-manipulation active:scale-95"
      >
        <Globe className="h-4 w-4" aria-hidden />
        <span>{copy.language}</span>
      </button>
    </header>
  )
}

export default TabletHeader
