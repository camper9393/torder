"use client"

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
  formatCartPortionSubtitle,
  normalizeMenuDocument,
  resolveMenuName,
} from "@/utils/menuBilingual"
import Image from "next/image"
import React from "react"

function CheckOutItem({
  item,
  compact = false,
  paper = false,
}: {
  item: CheckOutItems
  compact?: boolean
  paper?: boolean
}) {
  const dispatch = useAppDispatch()
  const { t, locale } = useLocale()
  const qty = item.itemCount
  const lineKey = item.cartLineKey ?? checkoutLineKey(item)
  const normalized = normalizeMenuDocument(item)
  const displayName = resolveMenuName(normalized, locale)
  const portionLine = formatCartPortionSubtitle(
    {
      title: normalized.title,
      nameMn: normalized.nameMn,
      nameEn: normalized.nameEn,
      selectedSizeLabelMn: item.selectedSizeLabelMn,
      selectedSizeLabelEn: item.selectedSizeLabelEn,
    },
    locale,
    qty
  )

  const handleUpdate = (newQty: number) => {
    if (newQty < 1) {
      dispatch(removeCheckItem(lineKey))
      dispatch(syncCartWithDB({ itemId: String(item._id), quantity: 0 }))
      return
    }

    if (newQty > qty) {
      dispatch(incrementCheckOutItem(lineKey))
    } else {
      dispatch(decrementCheckOutItem(lineKey))
    }

    dispatch(
      syncCartWithDB({
        itemId: String(item._id),
        quantity: newQty,
      })
    )
  }

  const titleBlock = (
    <>
      <h3
        className={
          compact
            ? paper
              ? "line-clamp-2 text-xs font-semibold leading-snug text-[#e8d4a8]"
              : "line-clamp-2 text-xs font-semibold leading-snug text-gray-900"
            : "text-sm font-medium text-gray-900 line-clamp-2"
        }
      >
        {displayName}
      </h3>
      {portionLine ? (
        <p
          className={
            compact
              ? paper
                ? "text-[11px] font-medium text-[#c9a227]"
                : "text-[11px] font-medium text-[#1E5EFF]"
              : "text-xs font-medium text-gray-600"
          }
        >
          {portionLine}
        </p>
      ) : null}
    </>
  )

  if (compact) {
    const shell = paper
      ? "flex w-full gap-2 rounded-xl border border-[#c9a227]/25 bg-[#121110]/80 p-2"
      : "flex w-full gap-2 rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5"
    const imgWrap = paper
      ? "relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#c9a227]/40"
      : "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg"
    const metaCls = paper ? "text-[10px] text-[#8a7344]" : "text-[10px] text-gray-500"
    const totalCls = paper ? "text-sm font-bold text-[#c9a227]" : "text-sm font-bold text-[#1E5EFF]"
    const qtyCls = paper
      ? "flex items-center gap-1 rounded-lg border border-[#c9a227]/50 bg-[#1c1916] px-1.5 py-0.5 text-[#c9a227]"
      : "flex items-center gap-1 rounded-lg border-2 border-[#1E5EFF] bg-[#f0f4fc] px-1.5 py-0.5 text-[#1E5EFF]"

    return (
      <div className={shell}>
        <div className={imgWrap}>
          <Image
            alt={displayName}
            fill
            src={item.image}
            className="object-cover"
            sizes="56px"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
          <div>
            {titleBlock}
            <p className={metaCls}>{formatPrice(item.price)}</p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className={totalCls}>{formatPrice(item.price * qty)}</span>
            <div className={qtyCls}>
              <button
                onClick={() => handleUpdate(qty - 1)}
                className="flex h-7 w-7 items-center justify-center text-sm font-bold"
                type="button"
                aria-label={t.tablet.decreaseQty}
              >
                −
              </button>
              <span className="min-w-[1.25rem] text-center text-xs font-semibold">
                {qty}
              </span>
              <button
                onClick={() => handleUpdate(qty + 1)}
                className="flex h-7 w-7 items-center justify-center text-sm font-bold"
                type="button"
                aria-label={t.tablet.increaseQty}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(30,94,255,0.08)] ring-1 ring-black/5 transition">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
        <Image alt={displayName} fill src={item.image} className="object-cover" />
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>{titleBlock}</div>

        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-[#1E5EFF]">
            {formatPrice(item.price * qty)}
          </span>

          <div className="flex items-center gap-3 rounded-xl border-2 border-[#1E5EFF] bg-[#f0f4fc] px-2 py-1 text-[#1E5EFF]">
            <button
              onClick={() => handleUpdate(qty - 1)}
              className="text-sm font-bold"
              type="button"
            >
              −
            </button>
            <span className="text-xs font-semibold">{qty}</span>
            <button
              onClick={() => handleUpdate(qty + 1)}
              className="text-sm font-bold"
              type="button"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckOutItem
