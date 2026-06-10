"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"

type InventoryMetricCardProps = {
  title: string
  value: string
  icon: React.ReactNode
  accent: string
}

function InventoryMetricCard({
  title,
  value,
  icon,
  accent,
}: InventoryMetricCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
          {title}
        </p>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accent
          )}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
        {value}
      </p>
    </div>
  )
}

export default memo(InventoryMetricCard)
