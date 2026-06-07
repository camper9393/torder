"use client"

import { HallTabs } from "./HallTabs"
import { HallDeleteButton } from "./HallDeleteButton"
import type { TableHall } from "@/types/floorLayout"
import { cn } from "@/lib/utils"

type HallSelectorBarProps = {
  halls: TableHall[]
  selectedHallId: string
  onSelect: (hallId: string) => void
  onAddHall?: () => void
  onDeleteHall?: () => void
  canDeleteHall?: boolean
  addHallLabel?: string
  deleteHallLabel?: string
  variant?: "bar" | "inline"
  className?: string
}

/** Hall tabs + optional delete control separated for safer UX. */
export function HallSelectorBar({
  halls,
  selectedHallId,
  onSelect,
  onAddHall,
  onDeleteHall,
  canDeleteHall = false,
  addHallLabel,
  deleteHallLabel,
  variant = "bar",
  className,
}: HallSelectorBarProps) {
  const isBar = variant === "bar"
  const showDelete = canDeleteHall && halls.length > 1 && onDeleteHall

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        isBar && "border-b border-slate-200 bg-white px-2 py-1.5",
        className
      )}
    >
      <HallTabs
        variant={variant}
        halls={halls}
        selectedHallId={selectedHallId}
        onSelect={onSelect}
        onAddHall={onAddHall}
        addHallLabel={addHallLabel}
      />
      {showDelete ? (
        <HallDeleteButton
          onClick={onDeleteHall}
          label={deleteHallLabel}
          className="ml-auto"
        />
      ) : null}
    </div>
  )
}
