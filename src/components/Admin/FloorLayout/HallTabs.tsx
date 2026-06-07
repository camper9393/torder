"use client"

import { Plus } from "lucide-react"
import type { TableHall } from "@/types/floorLayout"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type HallTabsProps = {
  halls: TableHall[]
  selectedHallId: string
  onSelect: (hallId: string) => void
  onAddHall?: () => void
  addHallLabel?: string
  className?: string
  /** inline = page header; bar = floor editor canvas header row */
  variant?: "bar" | "inline"
}

export function HallTabs({
  halls,
  selectedHallId,
  onSelect,
  onAddHall,
  addHallLabel = "Заал нэмэх",
  className,
  variant = "bar",
}: HallTabsProps) {
  const isInline = variant === "inline"

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto",
        isInline ? "py-0" : "px-1 py-0",
        className
      )}
    >
      {halls.map((hall) => {
        const active = hall.id === selectedHallId
        return (
          <button
            key={hall.id}
            type="button"
            onClick={() => onSelect(hall.id)}
            className={cn(
              "shrink-0 touch-manipulation font-semibold transition-colors",
              isInline ? "text-[11px]" : "text-xs",
              "rounded-full border px-3 py-1",
              active
                ? "border-green-600 bg-green-600 text-white shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900"
            )}
            aria-pressed={active}
          >
            {hall.name}
          </button>
        )
      })}
      {onAddHall ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "shrink-0 rounded-full border-slate-300 bg-white text-slate-600 hover:border-green-600 hover:bg-green-50 hover:text-green-700",
            isInline ? "h-6 w-6" : "h-7 w-7"
          )}
          onClick={onAddHall}
          aria-label={addHallLabel}
        >
          <Plus className={isInline ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </Button>
      ) : null}
    </div>
  )
}
