"use client"

import Image from "next/image"
import { ImagePlus, Minus, Plus, Trash2 } from "lucide-react"
import { useAppDispatch } from "@/hook/redux"
import {
  CheckOutItems,
  decrementCheckOutItem,
  incrementCheckOutItem,
  removeCheckItem,
  syncCartWithDB,
} from "@/store/reducer/checkout"
import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import {
  checkoutLineKey,
  normalizeMenuDocument,
  resolveMenuName,
  resolveStoredPortionLabel,
} from "@/utils/menuBilingual"
import { cn } from "@/lib/utils"

type TabletCartDrawerItemProps = {
  item: CheckOutItems
  isRecent?: boolean
}

function resolveCartPortionLabel(
  item: CheckOutItems,
  locale: "mn" | "en" | "ko"
): string | null {
  return resolveStoredPortionLabel(
    item.selectedSizeLabelMn,
    item.selectedSizeLabelEn,
    locale
  )
}

function TabletCartDrawerItem({ item, isRecent = false }: TabletCartDrawerItemProps) {
  const dispatch = useAppDispatch()
  const { locale, t } = useLocale()
  const lineKey = item.cartLineKey ?? checkoutLineKey(item)
  const normalized = normalizeMenuDocument(item)
  const displayName = resolveMenuName(normalized, locale)
  const portionLabel = resolveCartPortionLabel(item, locale)
  const lineTotal = item.price * item.itemCount
  const imageSrc = item.image?.trim()

  const syncQty = (newQty: number) => {
    dispatch(
      syncCartWithDB({
        itemId: String(item._id),
        quantity: newQty,
      })
    )
  }

  const handleDecrease = () => {
    if (item.itemCount <= 1) {
      dispatch(removeCheckItem(lineKey))
      syncQty(0)
      return
    }
    dispatch(decrementCheckOutItem(lineKey))
    syncQty(item.itemCount - 1)
  }

  const handleIncrease = () => {
    dispatch(incrementCheckOutItem(lineKey))
    syncQty(item.itemCount + 1)
  }

  const handleRemove = () => {
    dispatch(removeCheckItem(lineKey))
    syncQty(0)
  }

  return (
    <li
      className={cn(
        "rounded-xl border bg-white p-2.5",
        isRecent ? "border-red-200 bg-red-50/40" : "border-slate-200"
      )}
    >
      {isRecent ? (
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
          {t.tablet.recentlyAdded}
        </p>
      ) : null}

      <div className="flex gap-2.5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={displayName}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <ImagePlus className="h-5 w-5" aria-hidden />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">
            {displayName}
          </p>
          {portionLabel ? (
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
              {portionLabel}
            </p>
          ) : null}

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDecrease}
                aria-label={t.tablet.decreaseQty}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-95 touch-manipulation"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[1.25rem] text-center text-sm font-bold tabular-nums text-slate-900">
                {item.itemCount}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                aria-label={t.tablet.increaseQty}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-95 touch-manipulation"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                aria-label={t.tablet.removeItem}
                className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 active:scale-95 touch-manipulation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <span className="shrink-0 text-sm font-extrabold tabular-nums text-slate-900">
              {formatPrice(lineTotal)}
            </span>
          </div>
        </div>
      </div>
    </li>
  )
}

export default TabletCartDrawerItem
