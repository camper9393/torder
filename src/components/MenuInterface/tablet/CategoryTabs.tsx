"use client"

import { cn } from "@/lib/utils"

type CategoryTabsProps = {
  categories: string[]
  active: string
  onChange: (category: string) => void
}

function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  if (categories.length === 0) return null

  return (
    <div
      className="sticky top-[4.25rem] z-20 shrink-0 border-b border-[#1548D4] shadow-sm"
      style={{ background: "linear-gradient(180deg, #1E5EFF 0%, #1A56F0 100%)" }}
    >
      <div className="flex gap-2 overflow-x-auto px-3 py-2.5 scrollbar-hide touch-pan-x">
        {categories.map((category) => {
          const isActive = category === active
          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={cn(
                "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold touch-manipulation transition active:scale-95",
                isActive
                  ? "bg-white text-[#1E5EFF] shadow-md"
                  : "bg-white/15 text-white hover:bg-white/25"
              )}
            >
              {category}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryTabs
