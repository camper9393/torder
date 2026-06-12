"use client"

import React from "react"
import Image from "next/image"
import { formatTableLabel, getSessionOrderNumber } from "@/utils/tabletSession"
import { useLocale } from "@/context/LocaleContext"
import LanguageSwitcher from "@/components/common/LanguageSwitcher"
import {
  PAPER_MENU_ASSETS,
  PAPER_WAVE_BORDER_CLASS,
} from "./paperMenuAssets"
import { cn } from "@/lib/utils"
import { PAPER_GOLD, PAPER_GOLD_DIM, PAPER_GOLD_LIGHT } from "./tabletUi"

type TabletHeaderProps = {
  restaurantName: string
  tableName: string
  merchantId: string
}

function TabletHeader({
  restaurantName,
  tableName,
  merchantId,
}: TabletHeaderProps) {
  const { t, locale } = useLocale()
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

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-[#c9a227]/30 bg-[#121110]/95 backdrop-blur-md">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 opacity-60",
          PAPER_WAVE_BORDER_CLASS
        )}
        aria-hidden
      />

      <div className="relative flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
        <LanguageSwitcher
          compact
          variant="paper"
          className="shrink-0 border-[#c9a227]/40 bg-[#1c1916]/90"
        />

        <div className="flex min-w-0 flex-1 flex-col items-center">
          <div className="relative h-14 w-36 sm:h-16 sm:w-44">
            <Image
              src={PAPER_MENU_ASSETS.logo}
              alt={restaurantName}
              fill
              className="object-contain object-center drop-shadow-lg"
              priority
            />
          </div>
          <p
            className="mt-0.5 truncate text-center text-[10px] font-medium tracking-wide sm:text-xs"
            style={{ color: PAPER_GOLD_DIM }}
          >
            {restaurantName}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: PAPER_GOLD_DIM }}
          >
            {t.tablet.orderNo}
          </p>
          <p className="text-sm font-bold" style={{ color: PAPER_GOLD_LIGHT }}>
            #{String(orderNo).padStart(3, "0")}
          </p>
          <p
            className="mt-0.5 text-xs font-semibold"
            style={{ color: PAPER_GOLD }}
          >
            {formatTableLabel(tableName, locale)}
          </p>
        </div>
      </div>
    </header>
  )
}

export default TabletHeader
