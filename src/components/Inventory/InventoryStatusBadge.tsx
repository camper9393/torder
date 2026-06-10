"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"
import type { InventoryStockStatus } from "@/types/inventory"

const STATUS_LABELS: Record<InventoryStockStatus, string> = {
  ok: "Хэвийн",
  low: "Бага",
  out: "Дууссан",
}

const STATUS_STYLES: Record<InventoryStockStatus, string> = {
  ok: "bg-green-100 text-green-800 border-green-200",
  low: "bg-amber-100 text-amber-800 border-amber-200",
  out: "bg-red-100 text-red-800 border-red-200",
}

function InventoryStatusBadge({ status }: { status: InventoryStockStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export default memo(InventoryStatusBadge)
