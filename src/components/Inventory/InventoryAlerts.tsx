"use client"

import { memo } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import type { InventoryAlert } from "@/types/inventory"
import { formatInventoryUnit } from "@/utils/inventoryUnits"

type InventoryAlertsProps = {
  alerts: InventoryAlert[]
  compact?: boolean
}

function InventoryAlerts({ alerts, compact = false }: InventoryAlertsProps) {
  if (alerts.length === 0) return null

  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30"
          : "rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30"
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden />
          <h2 className="text-base font-semibold text-amber-900 dark:text-amber-100">
            Агуулахын анхааруулга
          </h2>
        </div>
        {!compact && (
          <Link
            href="/inventory/items"
            className="text-sm font-medium text-amber-800 hover:underline dark:text-amber-200"
          >
            Бүгдийг харах
          </Link>
        )}
      </div>
      <ul className="space-y-2">
        {alerts.map((alert) => (
          <li
            key={alert.itemId}
            className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-100"
          >
            <span aria-hidden>⚠</span>
            <span>
              <strong>{alert.itemName}</strong>{" "}
              {alert.status === "out"
                ? "дууссан"
                : `бага үлдсэн (${alert.currentStock} ${formatInventoryUnit(alert.unit)})`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default memo(InventoryAlerts)
