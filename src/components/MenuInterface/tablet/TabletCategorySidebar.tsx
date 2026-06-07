"use client"

import React from "react"
import Image from "next/image"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/context/LocaleContext"
import { useWaiterCallSubmit } from "@/hooks/useWaiterCallSubmit"
import { PAPER_MENU_ASSETS } from "./paperMenuAssets"
import { getCategoryLucideIcon } from "@/utils/categoryIcons"
import type { CategoryIconName } from "@/utils/categoryIcons"
import { TORDER_SIDEBAR_WIDTH_PX } from "./tabletUi"

type TabletCategorySidebarProps = {
  restaurantName: string
  categories: string[]
  categoryIcons?: Record<string, CategoryIconName | string>
  getCategoryLabel?: (categoryKey: string) => string
  active: string
  onChange: (category: string) => void
  merchantId: string
  tableName: string
}

function SidebarBrandHeader({ restaurantName }: { restaurantName: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 px-3 pb-2 pt-3">
      <div className="relative h-11 w-11 shrink-0">
        <Image
          src={PAPER_MENU_ASSETS.logo}
          alt={restaurantName}
          fill
          unoptimized
          className="object-contain object-center"
          priority
          sizes="44px"
        />
      </div>
      <p className="min-w-0 flex-1 text-sm font-bold leading-tight text-white">
        <span className="line-clamp-2">{restaurantName}</span>
      </p>
    </div>
  )
}

function TabletCategorySidebar({
  restaurantName,
  categories,
  categoryIcons = {},
  getCategoryLabel,
  active,
  onChange,
  merchantId,
  tableName,
}: TabletCategorySidebarProps) {
  const { t } = useLocale()
  const activeButtonRef = React.useRef<HTMLButtonElement>(null)
  const { callingStaff, submitWaiterCall } = useWaiterCallSubmit(
    merchantId,
    tableName
  )

  React.useEffect(() => {
    activeButtonRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    })
  }, [active])

  const handleCallStaff = () => {
    void submitWaiterCall()
  }

  return (
    <aside
      className="hidden h-full shrink-0 flex-col bg-black md:flex"
      style={{ width: TORDER_SIDEBAR_WIDTH_PX }}
    >
      <SidebarBrandHeader restaurantName={restaurantName} />

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1 pt-0.5">
        <ul className="space-y-0.5">
          {categories.map((category) => {
            const isActive = category === active
            const CategoryIcon = getCategoryLucideIcon(categoryIcons[category])

            return (
              <li key={category}>
                <button
                  ref={isActive ? activeButtonRef : undefined}
                  type="button"
                  onClick={() => onChange(category)}
                  className={cn(
                    "relative flex w-full items-center gap-2 py-2.5 pl-4 pr-3 text-left text-[15px] font-bold transition touch-manipulation",
                    isActive
                      ? "rounded-r-full bg-white text-black"
                      : "text-white hover:text-white/80"
                  )}
                >
                  {isActive ? (
                    <span
                      className="absolute left-0 top-1/2 h-9 w-[3px] -translate-y-1/2 rounded-full bg-[#e53935]"
                      aria-hidden
                    />
                  ) : null}
                  <CategoryIcon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive ? "text-black" : "text-white"
                    )}
                    aria-hidden
                  />
                  <span className="truncate leading-snug">
                    {getCategoryLabel?.(category) ?? category}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="shrink-0 p-3 pt-2">
        <button
          type="button"
          disabled={callingStaff}
          onClick={handleCallStaff}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2a2a2a] px-3 text-sm font-bold text-white transition hover:bg-[#333333] disabled:opacity-50 touch-manipulation"
        >
          <Bell className="h-4 w-4 shrink-0" aria-hidden />
          <span>{t.tablet.callStaff}</span>
        </button>
      </div>
    </aside>
  )
}

export default TabletCategorySidebar
export { SidebarBrandHeader }
