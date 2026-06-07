"use client"

import type { ReactNode } from "react"
import type { FloorLayoutTable } from "@/types/floorLayout"
import { normalizeShape } from "@/utils/floorLayout"
import { cn } from "@/lib/utils"

type FloorPlanTableSlotProps = {
  layout: Pick<FloorLayoutTable, "x" | "y" | "width" | "height" | "shape">
  children: ReactNode
  className?: string
  zIndex?: string
}

/**
 * Positions a table on the floor canvas using layout % (same in editor and Tables page).
 * Circle tables use equal width/height from layout data + pill border-radius.
 */
export function FloorPlanTableSlot({
  layout,
  children,
  className,
  zIndex = "z-10",
}: FloorPlanTableSlotProps) {
  const isCircle = normalizeShape(layout.shape) === "circle"

  return (
    <div
      data-floor-shape={isCircle ? "circle" : "rectangle"}
      className={cn(
        "absolute flex min-h-0 min-w-0 flex-col overflow-hidden",
        isCircle && "rounded-[9999px]",
        zIndex,
        className
      )}
      style={{
        left: `${layout.x}%`,
        top: `${layout.y}%`,
        width: `${layout.width}%`,
        height: `${layout.height}%`,
      }}
    >
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col items-stretch justify-stretch">
        {children}
      </div>
    </div>
  )
}
