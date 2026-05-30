"use client"

import { useAppDispatch, useAppSelector } from "@/hook/redux"
import {
  addCheckOutItem,
  decrementCheckOutItem,
  syncCartWithDB,
} from "@/store/reducer/checkout"
import { IMenu } from "@/types/menu"
import { Plus, Minus } from "lucide-react"
import Image from "next/image"
import React from "react"
import { tabletCopy, TabletLocale } from "./tabletUi"

function MenuGridItem({
  item,
  locale,
}: {
  item: IMenu
  locale: TabletLocale
}) {
  const dispatch = useAppDispatch()
  const copy = tabletCopy[locale]
  const checkout = useAppSelector((state) => state.checkOut.items)
  const merchant = useAppSelector((state) => state.merchant.merchant)
  const checkoutItem = checkout.find((_i) => _i._id === item._id)
  const qty = checkoutItem?.itemCount ?? 0

  const handleUpdate = (newQty: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (newQty > qty) {
      dispatch(addCheckOutItem(item))
    } else {
      dispatch(decrementCheckOutItem(String(item._id)))
    }
    if (merchant?._id) {
      dispatch(syncCartWithDB({ itemId: String(item._id), quantity: newQty }))
    }
  }

  const onCardClick = () => {
    if (qty === 0) handleUpdate(1)
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onCardClick()
        }
      }}
      className="flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(30,94,255,0.08)] ring-1 ring-black/5 transition active:scale-[0.98] touch-manipulation"
    >
      <div className="relative aspect-[4/3] w-full bg-gray-100">
        <Image
          alt={item.title}
          src={item.image}
          fill
          crossOrigin="anonymous"
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {qty > 0 && (
          <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#1E5EFF] px-2 text-xs font-bold text-white">
            {qty}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
          {item.title}
        </h3>
        <p className="text-lg font-bold text-[#1E5EFF]">₹{item.price}</p>

        {qty === 0 ? (
          <button
            type="button"
            onClick={(e) => handleUpdate(1, e)}
            className="mt-auto flex min-h-11 w-full items-center justify-center gap-1 rounded-xl bg-[#1E5EFF] text-sm font-semibold text-white shadow-sm active:bg-[#1548D4]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {copy.add}
          </button>
        ) : (
          <div
            className="mt-auto flex min-h-11 items-center justify-between rounded-xl border-2 border-[#1E5EFF] bg-[#f0f4fc] px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => handleUpdate(qty - 1, e)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1E5EFF] active:bg-white"
              aria-label="Decrease quantity"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="text-base font-bold text-[#1E5EFF]">{qty}</span>
            <button
              type="button"
              onClick={(e) => handleUpdate(qty + 1, e)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1E5EFF] active:bg-white"
              aria-label="Increase quantity"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

export default MenuGridItem
