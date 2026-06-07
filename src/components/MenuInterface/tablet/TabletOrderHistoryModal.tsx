"use client"

import React from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { ImagePlus, X } from "lucide-react"
import type { CheckOutItems } from "@/store/reducer/checkout"
import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import {
  normalizeMenuDocument,
  resolveMenuName,
  resolveStoredPortionLabel,
} from "@/utils/menuBilingual"
import { normalizeTableName } from "@/utils/table"
import {
  getTabletOrderHistory,
  TABLET_ORDER_HISTORY_EVENT,
  type TabletOrderHistoryBatch,
} from "@/utils/tabletOrderHistory"

type TabletOrderHistoryModalProps = {
  open: boolean
  merchantId: string
  tableName: string
  onClose: () => void
}

type HistoryLine = {
  key: string
  item: CheckOutItems
  submittedAt: string
  orderNo: number
}

function resolvePortionLabel(
  item: CheckOutItems,
  locale: "mn" | "en" | "ko"
): string | null {
  return resolveStoredPortionLabel(
    item.selectedSizeLabelMn,
    item.selectedSizeLabelEn,
    locale
  )
}

function formatOrderTime(iso: string, locale: "mn" | "en" | "ko"): string {
  const date = new Date(iso)
  const tag =
    locale === "mn" ? "mn-MN" : locale === "ko" ? "ko-KR" : "en-US"
  return date.toLocaleString(tag, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function flattenHistory(batches: TabletOrderHistoryBatch[]): HistoryLine[] {
  const lines: HistoryLine[] = []
  for (const batch of [...batches].reverse()) {
    for (const item of batch.items) {
      lines.push({
        key: `${batch.id}-${item.cartLineKey ?? item._id}`,
        item,
        submittedAt: batch.submittedAt,
        orderNo: batch.orderNo,
      })
    }
  }
  return lines
}

function TabletOrderHistoryLine({
  line,
}: {
  line: HistoryLine
}) {
  const { locale, t } = useLocale()
  const normalized = normalizeMenuDocument(line.item)
  const displayName = resolveMenuName(normalized, locale)
  const portionLabel = resolvePortionLabel(line.item, locale)
  const imageSrc = line.item.image?.trim()
  const lineTotal = line.item.price * line.item.itemCount

  return (
    <li className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={displayName}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <ImagePlus className="h-5 w-5" aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
        {portionLabel ? (
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
            {portionLabel}
          </p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600">
          <span>
            {t.tablet.qtyLabel}{" "}
            <span className="font-bold tabular-nums text-slate-900">
              {line.item.itemCount}
            </span>
          </span>
          <span className="text-slate-300">·</span>
          <span>{formatOrderTime(line.submittedAt, locale)}</span>
        </div>
      </div>

      <span className="shrink-0 self-center text-sm font-extrabold tabular-nums text-slate-900">
        {formatPrice(lineTotal)}
      </span>
    </li>
  )
}

function TabletOrderHistoryModal({
  open,
  merchantId,
  tableName,
  onClose,
}: TabletOrderHistoryModalProps) {
  const { t } = useLocale()
  const [batches, setBatches] = React.useState<TabletOrderHistoryBatch[]>([])

  const reload = React.useCallback(() => {
    setBatches(getTabletOrderHistory(merchantId, tableName))
  }, [merchantId, tableName])

  React.useEffect(() => {
    if (!open) return
    reload()
  }, [open, reload])

  React.useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ merchantId: string; tableName: string }>)
        .detail
      if (
        detail?.merchantId === merchantId &&
        detail?.tableName === normalizeTableName(tableName)
      ) {
        reload()
      }
    }

    window.addEventListener(TABLET_ORDER_HISTORY_EVENT, onUpdate)
    return () => window.removeEventListener(TABLET_ORDER_HISTORY_EVENT, onUpdate)
  }, [merchantId, tableName, reload])

  const lines = React.useMemo(() => flattenHistory(batches), [batches])

  const totalQty = lines.reduce((sum, line) => sum + line.item.itemCount, 0)
  const totalAmount = lines.reduce(
    (sum, line) => sum + line.item.price * line.item.itemCount,
    0
  )

  if (typeof document === "undefined" || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={t.common.close}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tablet-order-history-title"
        className="relative flex max-h-[min(92dvh,820px)] w-full max-w-[560px] flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3.5 sm:px-5">
          <h2
            id="tablet-order-history-title"
            className="text-lg font-bold text-slate-900"
          >
            {t.tablet.orderHistoryTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 active:scale-95 touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 sm:px-5">
          {lines.length === 0 ? (
            <p className="py-16 text-center text-sm font-medium text-slate-500">
              {t.tablet.historyEmpty}
            </p>
          ) : (
            <ul>
              {lines.map((line) => (
                <TabletOrderHistoryLine key={line.key} line={line} />
              ))}
            </ul>
          )}
        </div>

        <footer className="shrink-0 bg-red-600 px-4 py-4 text-white sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">
              {t.tablet.historyTotalLabel}
            </span>
            <div className="text-right">
              <p className="text-xs font-medium text-red-100">
                {t.tablet.piecesCount(totalQty)}
              </p>
              <p className="text-xl font-extrabold tabular-nums">
                {formatPrice(totalAmount)}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  )
}

export default TabletOrderHistoryModal
