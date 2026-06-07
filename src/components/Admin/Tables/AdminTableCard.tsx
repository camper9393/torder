"use client"

import React from "react"
import { TableSummary } from "@/types/table"
import {
  formatAdminMoreOthers,
  formatTableDisplayName,
} from "@/utils/adminTableDisplay"
import {
  buildTicketItemList,
  getTableCardVisualState,
  tableCardVisualStyles,
} from "@/utils/adminTableCardVisual"
import { formatOrderElapsed } from "@/utils/formatOrderElapsed"
import { adminTablePosStyles } from "@/utils/adminTablePosStyles"
import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import { cn } from "@/lib/utils"
import { Check, Clock, GripVertical } from "lucide-react"
import { useTableCardDrag } from "./useTableCardDrag"

/** HH:MM with blinking colon only (1s on/off). */
function TableElapsedTimer({
  value,
  className,
  size = "floor",
}: {
  value: string
  className?: string
  size?: "floor" | "grid"
}) {
  const [colonVisible, setColonVisible] = React.useState(true)

  React.useEffect(() => {
    const id = window.setInterval(() => setColonVisible((v) => !v), 1000)
    return () => window.clearInterval(id)
  }, [])

  const parts = value.split(":")
  const hours = parts[0] ?? "00"
  const minutes = parts[1] ?? "00"

  return (
    <span
      className={cn(
        "table-elapsed-timer inline-flex items-baseline font-bold tabular-nums leading-none tracking-tight",
        size === "floor"
          ? "text-[clamp(14px,5cqi,22px)]"
          : "rounded-md bg-white/90 px-2 py-0.5 text-xl shadow-sm sm:text-2xl",
        className
      )}
      aria-label={`Elapsed ${value}`}
    >
      <span>{hours}</span>
      <span
        className={cn(
          "mx-px inline-block min-w-[0.35em] text-center",
          colonVisible ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      >
        :
      </span>
      <span>{minutes}</span>
    </span>
  )
}

type AdminTableCardProps = {
  table: TableSummary
  floorPlanMode?: boolean
  isDragging?: boolean
  isDropTarget?: boolean
  layoutDragActive?: boolean
  onOpen: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onMarkItemServed?: (orderId: string, itemIndex: number) => void
  markingServedKey?: string | null
  onAcceptNewOrders?: () => void
  acceptingNewOrders?: boolean
}

function TicketItemRow({
  item,
  markingServed,
  onMarkServed,
  allowMarkServed,
  compact,
}: {
  item: {
    orderId: string
    itemIndex: number
    title: string
    quantity: number
    served: boolean
  }
  markingServed?: boolean
  onMarkServed?: () => void
  allowMarkServed: boolean
  compact?: boolean
}) {
  const isServed = item.served === true
  const canTap = allowMarkServed && !isServed && onMarkServed

  const content = (
    <>
      {isServed ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-2.5 w-2.5 stroke-[3]" aria-hidden />
        </span>
      ) : (
        <Clock
          className={cn(
            "shrink-0 text-slate-400 stroke-[2]",
            compact ? "h-4 w-4" : "h-5 w-5"
          )}
          aria-hidden
        />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-left leading-snug",
          compact ? "text-sm" : "text-lg",
          isServed
            ? "font-medium text-slate-400 opacity-60"
            : "font-bold text-slate-900"
        )}
      >
        <span className="tabular-nums">{item.quantity}×</span> {item.title}
      </span>
    </>
  )

  const rowClass = cn(
    "flex w-full items-center gap-2 px-1",
    compact ? "min-h-[36px] py-1.5" : "min-h-[52px] gap-3 py-3.5"
  )

  if (canTap) {
    return (
      <li className="border-b border-slate-100 last:border-0">
        <div
          role="button"
          tabIndex={0}
          aria-disabled={markingServed}
          onClick={(e) => {
            e.stopPropagation()
            if (!markingServed) onMarkServed()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              e.stopPropagation()
              if (!markingServed) onMarkServed()
            }
          }}
          className={cn(
            rowClass,
            "cursor-pointer text-left touch-manipulation",
            "hover:bg-white/60 active:bg-white/80",
            markingServed && "pointer-events-none opacity-50",
            "rounded-lg transition-colors"
          )}
        >
          {content}
        </div>
      </li>
    )
  }

  return (
    <li className="border-b border-slate-100 last:border-0">
      <div className={rowClass}>{content}</div>
    </li>
  )
}

type FloorPlanTableCardProps = {
  table: TableSummary
  displayName: string
  visual: (typeof tableCardVisualStyles)[keyof typeof tableCardVisualStyles]
  visualState: ReturnType<typeof getTableCardVisualState>
  elapsed: string
  showElapsed: boolean
  acceptingNewOrders?: boolean
  isNew: boolean
  onAcceptNewOrders?: () => void
  onOpen: () => void
}

/** Floor-plan card: color = status; name + price (+ optional time). */
function FloorPlanTableCard({
  table,
  displayName,
  visual,
  visualState,
  elapsed,
  showElapsed,
  acceptingNewOrders,
  isNew,
  onAcceptNewOrders,
  onOpen,
}: FloorPlanTableCardProps) {
  const isEmpty = visualState === "empty"
  const showTime = showElapsed
  const totalAmount = isEmpty ? 0 : table.totalAmount

  const handleActivate = () => {
    if (acceptingNewOrders) return
    if (isNew && onAcceptNewOrders) {
      onAcceptNewOrders()
      return
    }
    onOpen()
  }

  return (
    <div
      onClick={handleActivate}
      className={cn("floor-plan-table-card", visual.card)}
      data-floor-status={visualState}
    >
      <div className="floor-card-body">
        <div className="floor-card-top">
          <h2 className="floor-card-name">{displayName}</h2>
        </div>

        {showTime ? (
          <div className="floor-card-elapsed" aria-hidden={false}>
            <TableElapsedTimer
              value={elapsed}
              className={visual.elapsed}
              size="floor"
            />
          </div>
        ) : (
          <div className="floor-card-spacer" aria-hidden />
        )}
      </div>

      <div className="floor-card-footer">
        <p className="floor-card-price">{formatPrice(totalAmount)}</p>
      </div>
    </div>
  )
}

function AdminTableCard({
  table,
  floorPlanMode = false,
  isDragging,
  isDropTarget,
  layoutDragActive,
  onOpen,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onMarkItemServed,
  markingServedKey,
  onAcceptNewOrders,
  acceptingNewOrders,
}: AdminTableCardProps) {
  const { t } = useLocale()
  const at = t.adminTables
  const freePos = adminTablePosStyles.free
  const visualState = getTableCardVisualState(table)
  const visual = tableCardVisualStyles[visualState]
  const isNew = visualState === "new"
  const isEmpty = visualState === "empty"
  const displayName = formatTableDisplayName(
    table.tableName,
    t.common.table,
    table.layout?.displayLabel
  )
  const ticketItems = buildTicketItemList(table)
  const moreHidden =
    (table.morePendingCount ?? 0) + (table.moreServedCount ?? 0)
  const [, setTick] = React.useState(0)

  const useReorderDrag = !floorPlanMode && Boolean(onDragStart && onDragEnd)

  const { handleDragStart, handleDragEnd, shouldIgnoreClick } = useTableCardDrag({
    tableName: table.tableName,
    layoutDragActive: layoutDragActive ?? false,
    onDragStart: onDragStart ?? (() => {}),
    onDragEnd: onDragEnd ?? (() => {}),
  })

  React.useEffect(() => {
    if (isEmpty || !table.latestOrderTime) return
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000)
    return () => window.clearInterval(id)
  }, [isEmpty, table.latestOrderTime])

  const elapsed = formatOrderElapsed(table.latestOrderTime)
  const showElapsed = !isEmpty && Boolean(table.latestOrderTime) && Boolean(elapsed)

  const statusBadgeLabel =
    visualState === "new"
      ? acceptingNewOrders
        ? "…"
        : at.statusBadgeNew
      : visualState === "waiter_called"
        ? at.statusBadgeWaiterCalled
        : visualState === "accepted_pending"
          ? at.statusBadgeAccepted
          : visualState === "paid"
            ? at.statusBadgePaid
            : freePos.badgeLabel

  const handleCardActivate = () => {
    if (acceptingNewOrders) return
    if (useReorderDrag && shouldIgnoreClick()) return
    if (isNew && onAcceptNewOrders) {
      onAcceptNewOrders()
      return
    }
    onOpen()
  }

  const dragSurfaceProps = useReorderDrag
    ? {
        draggable: true as const,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
      }
    : {}

  const rootClass = cn(
    "relative flex w-full flex-col overflow-hidden rounded-xl p-0 text-left touch-manipulation",
    isEmpty ? "min-h-[260px]" : "min-h-[340px]",
    useReorderDrag && (layoutDragActive ? "cursor-grabbing" : "cursor-grab"),
    !useReorderDrag && "cursor-pointer",
    visual.card,
    isNew && !layoutDragActive && "admin-table-card--new",
    isDragging && "scale-[0.98] opacity-50",
    isDropTarget && "ring-2 ring-[#1E5EFF] ring-offset-2"
  )

  if (floorPlanMode) {
    return (
      <FloorPlanTableCard
        table={table}
        displayName={displayName}
        visual={visual}
        visualState={visualState}
        elapsed={elapsed}
        showElapsed={showElapsed}
        acceptingNewOrders={acceptingNewOrders}
        isNew={isNew}
        onAcceptNewOrders={onAcceptNewOrders}
        onOpen={onOpen}
      />
    )
  }

  if (isEmpty) {
    return (
      <div
        {...dragSurfaceProps}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={handleCardActivate}
        className={rootClass}
      >
        <div className="table-card-body flex min-h-0 flex-1 flex-col p-2 sm:p-3">
          <header className="mb-1 flex items-center gap-1 border-b border-slate-100 pb-1.5 sm:mb-2 sm:gap-2 sm:pb-2">
            {useReorderDrag && (
              <GripVertical
                className="h-4 w-4 shrink-0 text-slate-400 sm:h-5 sm:w-5"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "shrink-0 rounded px-2 py-1 text-xs font-semibold",
                visual.statusPill
              )}
            >
              {statusBadgeLabel}
            </span>
            <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 sm:text-lg">
              {displayName}
            </h2>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-4 sm:gap-2 sm:py-8">
            <p className="text-base text-slate-500">{at.noOrder}</p>
          </div>
        </div>
        <footer className="table-card-price-footer">
          <p className="table-card-price-text text-slate-700">
            {at.totalLabel}: {formatPrice(0)}
          </p>
        </footer>
      </div>
    )
  }

  return (
    <div
      {...dragSurfaceProps}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={handleCardActivate}
      className={rootClass}
    >
      <div className="table-card-body relative flex min-h-0 flex-1 flex-col p-2 sm:p-3">
        <header className="mb-1 flex min-w-0 shrink-0 items-center gap-2 border-b border-slate-200/80 pb-1.5 sm:mb-2 sm:pb-2">
          {useReorderDrag && (
            <GripVertical
              className="h-4 w-4 shrink-0 text-slate-400 sm:h-5 sm:w-5"
              aria-hidden
            />
          )}
          <span
            className={cn(
              "shrink-0 rounded px-2.5 py-1 text-xs font-semibold sm:text-sm",
              visual.statusPill
            )}
          >
            {statusBadgeLabel}
          </span>
          <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 sm:text-lg">
            {displayName}
          </h2>
        </header>

        {showElapsed ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] flex -translate-y-1/2 justify-center px-2"
            aria-hidden={false}
          >
            <TableElapsedTimer
              value={elapsed}
              className={visual.elapsed}
              size="grid"
            />
          </div>
        ) : null}

        <ul className="mb-1 min-h-0 flex-1 space-y-0 overflow-y-auto overflow-x-hidden sm:mb-2">
          {ticketItems.map((item) => (
            <TicketItemRow
              key={`${item.orderId}-${item.itemIndex}`}
              item={item}
              allowMarkServed={!isNew}
              markingServed={
                markingServedKey === `${item.orderId}-${item.itemIndex}`
              }
              onMarkServed={
                onMarkItemServed
                  ? () => onMarkItemServed(item.orderId, item.itemIndex)
                  : undefined
              }
            />
          ))}
          {moreHidden > 0 && (
            <li className="truncate py-1 text-center text-xs font-medium text-slate-500">
              {formatAdminMoreOthers(at.moreOthers, moreHidden)}
            </li>
          )}
        </ul>
      </div>

      <footer className="table-card-price-footer">
        <p className="table-card-price-text">{formatPrice(table.totalAmount)}</p>
      </footer>
    </div>
  )
}

export default AdminTableCard
