"use client"

import Image from "next/image"
import { formatPrice } from "@/utils/currency"
import { cn } from "@/lib/utils"
import { Check, ImagePlus, Minus, Plus, Trash2 } from "lucide-react"

export type AdminTableOrderItemRowProps = {
  name: string
  portionLabel?: string
  image?: string
  quantity: number
  /** Line subtotal (unit price × quantity). Prefer over `price`. */
  lineSubtotal: number
  /** @deprecated Use lineSubtotal */
  price?: number
  served?: boolean
  servedBadgeLabel?: string
  markServedLabel?: string
  itemServedDoneLabel?: string
  showServedButton?: boolean
  markingServed?: boolean
  onMarkServed?: () => void
  /** Main table modal: read-only. Food picker / edit flows: editable controls. */
  readOnly?: boolean
  disabled?: boolean
  onDecrease?: () => void
  onIncrease?: () => void
  onRemove?: () => void
  removeLabel?: string
}

const qtyBtnClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:opacity-40 touch-manipulation"

function OrderItemThumbnail({ image, alt }: { image?: string; alt: string }) {
  const src = image?.trim()
  if (!src) {
    return (
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400"
        aria-hidden
      >
        <ImagePlus className="h-4 w-4" />
      </div>
    )
  }

  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-slate-100">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-center"
        sizes="44px"
      />
    </div>
  )
}

function AdminTableOrderItemRow({
  name,
  portionLabel,
  image,
  quantity,
  lineSubtotal,
  price: _legacyPrice,
  served = false,
  servedBadgeLabel = "Өгсөн",
  markServedLabel = "Захиалга өгсөн",
  itemServedDoneLabel = "Өгсөн",
  showServedButton = false,
  markingServed,
  onMarkServed,
  readOnly = true,
  disabled,
  onDecrease,
  onIncrease,
  onRemove,
  removeLabel = "Устгах",
}: AdminTableOrderItemRowProps) {
  const lineTotal = lineSubtotal
  const isServed = served === true

  const priceClass = cn(
    "text-xs font-bold tabular-nums leading-none",
    isServed ? "text-slate-400" : "text-[#1E5EFF]"
  )

  const nameMetaBlock = (
    <div className="min-w-0 flex-1">
      <p
        className={cn(
          "truncate text-sm font-medium leading-snug",
          isServed
            ? "text-slate-500 line-through decoration-slate-400"
            : "text-slate-900"
        )}
      >
        {name}
        {isServed && !showServedButton ? (
          <span className="ml-1 inline-flex rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 no-underline">
            {servedBadgeLabel}
          </span>
        ) : null}
      </p>
      <p className="mt-0.5 truncate text-[11px] leading-snug text-slate-500">
        {portionLabel ? (
          <>
            <span>{portionLabel}</span>
            <span className="mx-1 text-slate-300">·</span>
          </>
        ) : null}
        <span className="font-medium text-slate-600">x{quantity}</span>
      </p>
    </div>
  )

  const servedStatusButton = showServedButton ? (
    <button
      type="button"
      disabled={isServed || disabled || markingServed}
      onClick={isServed ? undefined : onMarkServed}
      aria-disabled={isServed || disabled || markingServed}
      className={cn(
        "inline-flex h-7 shrink-0 items-center justify-center gap-0.5 whitespace-nowrap rounded-md border px-2 text-[11px] font-semibold leading-none touch-manipulation",
        isServed
          ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      )}
    >
      {isServed ? (
        <>
          <span>{servedBadgeLabel}</span>
          <Check className="h-3 w-3 shrink-0 stroke-[2.5]" aria-hidden />
        </>
      ) : (
        markServedLabel
      )}
    </button>
  ) : null

  if (readOnly) {
    return (
      <li
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 transition-colors",
          isServed && "bg-slate-100/80"
        )}
      >
        <OrderItemThumbnail image={image} alt={name} />
        {nameMetaBlock}
        {showServedButton ? (
          <div className="flex shrink-0 flex-col items-end justify-center gap-1">
            <span className={priceClass}>{formatPrice(lineTotal)}</span>
            {servedStatusButton}
          </div>
        ) : (
          <span className={cn(priceClass, "shrink-0 self-center")}>
            {formatPrice(lineTotal)}
          </span>
        )}
      </li>
    )
  }

  return (
    <li
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 transition-colors",
        isServed && "bg-slate-100/80"
      )}
    >
      <OrderItemThumbnail image={image} alt={name} />
      {nameMetaBlock}
      <span className={cn(priceClass, "shrink-0 self-center")}>
        {formatPrice(lineTotal)}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          disabled={disabled}
          onClick={onDecrease}
          aria-label="Багасгах"
          className={qtyBtnClass}
        >
          <Minus className="h-3.5 w-3.5" aria-hidden />
        </button>
        <span className="min-w-[1.125rem] text-center text-sm font-bold tabular-nums text-slate-900">
          {quantity}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={onIncrease}
          aria-label="Нэмэх"
          className={qtyBtnClass}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      {onRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={removeLabel}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-40 touch-manipulation"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </li>
  )
}

export default AdminTableOrderItemRow
