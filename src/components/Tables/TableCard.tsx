"use client"

import { TableSummary } from "@/types/table"
import { formatTableDisplayName } from "@/utils/adminTableDisplay"
import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import { tableStatusCardStyles } from "@/utils/tableStatusStyles"
import { cn } from "@/lib/utils"

type TableCardProps = {
  table: TableSummary
  onClick: () => void
}

function TableCard({ table, onClick }: TableCardProps) {
  const { t, dateLocale } = useLocale()
  const tbl = t.tables
  const styles = tableStatusCardStyles[table.status]
  const statusLabel = tbl.status[table.status]
  const displayName = formatTableDisplayName(table.tableName, t.common.table)

  const formatTime = (value: string | null) => {
    if (!value) return "—"
    return new Date(value).toLocaleString(dateLocale, {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition hover:shadow-md touch-manipulation",
        styles.border
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
            styles.badge
          )}
        >
          {statusLabel}
        </span>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">{tbl.orderCount}</dt>
          <dd className="font-semibold text-gray-900">
            {table.activeOrderCount}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">{t.common.total}</dt>
          <dd className="font-semibold text-[#1E5EFF]">
            {formatPrice(table.totalAmount)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">{tbl.latestOrder}</dt>
          <dd className="text-right text-gray-700">
            {formatTime(table.latestOrderTime)}
          </dd>
        </div>
      </dl>
    </button>
  )
}

export default TableCard
