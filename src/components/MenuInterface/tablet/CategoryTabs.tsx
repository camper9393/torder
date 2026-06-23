"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { getCategoryLucideIcon } from "@/utils/categoryIcons"
import type { CategoryIconName } from "@/utils/categoryIcons"

type CategoryTabsProps = {
  categories: string[]
  categoryIcons?: Record<string, CategoryIconName | string>
  getCategoryLabel?: (categoryKey: string) => string
  active: string
  onChange: (category: string) => void
  variant?: "paper" | "torder"
}

function CategoryTabs({
  categories,
  categoryIcons = {},
  getCategoryLabel,
  active,
  onChange,
  variant = "paper",
}: CategoryTabsProps) {
  const activeButtonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const el = activeButtonRef.current
    if (!el) return

    const scroller = el.parentElement
    if (!scroller) return

    const scrollerRect = scroller.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()

    if (elRect.left >= scrollerRect.left && elRect.right <= scrollerRect.right) {
      return
    }

    el.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: "auto",
    })
  }, [active])

  if (categories.length === 0) return null

  if (variant === "torder") {
    return (
      <div className="tablet-mobile-category-bar shrink-0">
        <div className="flex gap-1 overflow-x-auto px-2 py-2 scrollbar-hide touch-pan-x">
          {categories.map((category) => {
            const isActive = category === active
            const CategoryIcon = getCategoryLucideIcon(categoryIcons[category])
            return (
              <button
                key={category}
                ref={isActive ? activeButtonRef : undefined}
                type="button"
                onClick={() => onChange(category)}
                className={cn(
                  "tablet-category-tab tablet-font-sidebar relative flex shrink-0 items-center gap-1.5 px-4 py-2.5 font-bold touch-manipulation transition active:scale-95",
                  isActive
                    ? "tablet-sidebar-category-active rounded-r-full pr-5"
                    : "tablet-sidebar-category-inactive"
                )}
              >
                {isActive ? (
                  <span
                    className="tablet-category-accent-bar absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full"
                    aria-hidden
                  />
                ) : null}
                <CategoryIcon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "" : "text-[var(--tablet-sidebar-text)]"
                  )}
                  aria-hidden
                />
                {getCategoryLabel?.(category) ?? category}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-[4.75rem] z-20 shrink-0 border-b border-[#c9a227]/25 bg-[#1a1714]/95 backdrop-blur-sm">
      <div className="flex gap-2 overflow-x-auto px-3 py-2.5 scrollbar-hide touch-pan-x">
        {categories.map((category) => {
          const isActive = category === active
          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={cn(
                "shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold touch-manipulation transition active:scale-95",
                isActive
                  ? "border-[#c9a227] bg-[#c9a227] text-[#121110] shadow-[0_0_12px_rgba(201,162,39,0.35)]"
                  : "border-[#c9a227]/35 bg-transparent text-[#e8d4a8] hover:border-[#c9a227]/60 hover:bg-[#c9a227]/10"
              )}
            >
              {getCategoryLabel?.(category) ?? category}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryTabs
