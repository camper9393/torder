"use client"

import Image from "next/image"
import { ImagePlus, Minus, Plus } from "lucide-react"
import React from "react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import { SpicyMenuBadge } from "@/components/MenuInterface/SpicyMenuBadge"
import { normalizeSpicyLevel } from "@/utils/menuSpicy"
import {
  buildCheckoutLineFromMenu,
  menuNeedsPortionPicker,
  normalizeMenuDocument,
  resolveMenuDescription,
  resolveMenuName,
  resolveSizeLabel,
  type BilingualMenuSize,
} from "@/utils/menuBilingual"
import type { IMenu } from "@/types/menu"
import type { CheckOutItems } from "@/store/reducer/checkout"
import { resolveMenuUnitPrice } from "@/utils/orderLineMapping"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import {
  MENU_BADGE_STYLES,
  resolveMenuCardBadges,
  type MenuCardBadge,
} from "./menuCardBadges"

type MenuItemPortionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: IMenu
  onAddToCart: (line: CheckOutItems) => void
}

type MenuToppingOption = {
  nameMn?: string
  nameEn?: string
  name?: string
  price?: number
}

function resolveMenuToppings(item: IMenu): MenuToppingOption[] {
  const raw = (item as IMenu & { toppings?: unknown }).toppings
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (entry): entry is MenuToppingOption =>
      entry != null && typeof entry === "object"
  )
}

function resolveToppingLabel(
  topping: MenuToppingOption,
  locale: "mn" | "en" | "ko"
): string {
  if (locale === "en") {
    return topping.nameEn?.trim() || topping.name?.trim() || topping.nameMn?.trim() || ""
  }
  return topping.nameMn?.trim() || topping.name?.trim() || topping.nameEn?.trim() || ""
}

function BestRibbon() {
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-20 h-20 w-20 overflow-hidden"
      aria-hidden
    >
      <span className="absolute left-[-30px] top-[18px] flex w-[120px] -rotate-45 items-center justify-center bg-red-600 py-1.5 text-xs font-extrabold tracking-wider text-white shadow-md">
        BEST
      </span>
    </div>
  )
}

function BadgePills({ badges }: { badges: MenuCardBadge[] }) {
  const pills = badges.filter((b) => b !== "BEST")
  if (pills.length === 0) return null

  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2">
      {pills.map((badge) => (
        <span
          key={badge}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide shadow-md",
            MENU_BADGE_STYLES[badge].pill
          )}
        >
          {MENU_BADGE_STYLES[badge].label}
        </span>
      ))}
    </div>
  )
}

function MenuItemPortionModal({
  open,
  onOpenChange,
  item: rawItem,
  onAddToCart,
}: MenuItemPortionModalProps) {
  const { t, locale } = useLocale()
  const item = normalizeMenuDocument(rawItem)
  const sizes = item.sizes ?? []
  const needsPortionPicker = menuNeedsPortionPicker(item)
  const singleSize = sizes.length === 1 ? sizes[0] : undefined
  const badges = resolveMenuCardBadges(rawItem)
  const toppings = resolveMenuToppings(rawItem)

  const [selectedSize, setSelectedSize] = React.useState<
    BilingualMenuSize | null
  >(null)
  const [quantity, setQuantity] = React.useState(1)

  React.useEffect(() => {
    if (!open) return
    setQuantity(1)
    const portionSizes = normalizeMenuDocument(rawItem).sizes ?? []
    if (portionSizes.length > 1) {
      setSelectedSize(null)
    } else if (portionSizes.length === 1) {
      setSelectedSize(portionSizes[0])
    } else {
      setSelectedSize(null)
    }
  }, [open, rawItem])

  const displayName = resolveMenuName(item, locale)
  const description =
    resolveMenuDescription(item, locale) ||
    (item.quantity > 0 ? t.tablet.pcWeight(item.quantity) : "")

  const activeSize = needsPortionPicker ? selectedSize : singleSize ?? null
  const canShowQuantity = !needsPortionPicker || selectedSize != null
  const isPortionUnselected = needsPortionPicker && selectedSize == null
  const unitPrice =
    resolveMenuUnitPrice(
      {
        ...item,
        selectedSize: activeSize ?? undefined,
        selectedSizeLabelMn: activeSize?.labelMn,
        selectedSizeLabelEn: activeSize?.labelEn,
        menuItem: item,
      },
      { debugLabel: displayName, quantity }
    ) ?? 0
  const lineTotal = unitPrice * quantity

  const handleAdd = () => {
    if (needsPortionPicker && !selectedSize) return
    const line = buildCheckoutLineFromMenu(item, activeSize ?? undefined, quantity)
    if (!line) {
      toast.error("Үнэ олдсонгүй. Цэсний мэдээллийг шалгана уу.")
      return
    }
    onAddToCart({
      ...line,
      itemCount: quantity,
    } as CheckOutItems)
    onOpenChange(false)
  }

  const imageSrc = item.image?.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        centered
        showCloseButton={false}
        className="flex h-[min(85dvh,900px)] max-h-[85dvh] w-[min(92vw,1100px)] max-w-none flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          <div className="relative aspect-[16/10] max-h-[min(32dvh,200px)] w-full shrink-0 self-stretch bg-slate-100 md:aspect-auto md:max-h-none md:w-[40%]">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={displayName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
                crossOrigin="anonymous"
                priority
              />
            ) : (
              <div className="flex h-full min-h-[120px] items-center justify-center text-slate-400 md:min-h-full">
                <ImagePlus className="h-12 w-12 md:h-16 md:w-16" aria-hidden />
              </div>
            )}
            {badges.includes("BEST") ? <BestRibbon /> : null}
            <BadgePills badges={badges} />
            <SpicyMenuBadge
              level={normalizeSpicyLevel(item.spicyLevel, item.spicy)}
              className="!right-3 !left-auto !top-3 md:!right-4 md:!top-4"
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 md:px-6 md:py-4">
              <DialogTitle className="text-xl font-extrabold leading-tight text-slate-900 md:text-2xl">
                {displayName}
              </DialogTitle>
              {description ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[15px]">
                  {description}
                </p>
              ) : null}

              {needsPortionPicker ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t.tablet.selectPortion}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sizes.map((size, idx) => {
                      const isSelected =
                        selectedSize?.labelMn === size.labelMn &&
                        selectedSize?.labelEn === size.labelEn &&
                        selectedSize?.price === size.price
                      const label = resolveSizeLabel(size, locale)
                      return (
                        <button
                          key={`${size.labelMn}-${size.labelEn}-${idx}`}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "flex min-h-[3.25rem] touch-manipulation flex-col items-center justify-center rounded-lg border-2 px-3 py-2 text-center transition active:scale-[0.99]",
                            isSelected
                              ? "border-red-600 bg-red-50 text-red-700 shadow-sm ring-1 ring-red-200"
                              : "border-slate-200 bg-white text-slate-800 hover:border-red-300 hover:bg-red-50/40"
                          )}
                        >
                          <span className="text-sm font-bold leading-tight md:text-base">
                            {label}
                          </span>
                          <span
                            className={cn(
                              "mt-0.5 text-base font-extrabold tabular-nums md:text-lg",
                              isSelected ? "text-red-600" : "text-slate-900"
                            )}
                          >
                            {formatPrice(size.price)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {toppings.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t.tablet.extraOptions}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {toppings.map((topping, idx) => {
                      const label = resolveToppingLabel(topping, locale)
                      if (!label) return null
                      return (
                        <span
                          key={`${label}-${idx}`}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 md:text-sm"
                        >
                          {label}
                          {typeof topping.price === "number" && topping.price > 0
                            ? ` +${formatPrice(topping.price)}`
                            : null}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {canShowQuantity ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t.tablet.quantity}
                  </p>
                  <div className="inline-flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <button
                      type="button"
                      aria-label={t.tablet.decreaseQty}
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 active:scale-95"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="min-w-[2rem] text-center text-2xl font-extrabold tabular-nums text-slate-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={t.tablet.increaseQty}
                      onClick={() => setQuantity((q) => q + 1)}
                      className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 active:scale-95"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] md:px-6">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {t.tablet.selectedTotal}
                  </p>
                  <p
                    className={cn(
                      "text-xl font-extrabold tabular-nums md:text-2xl",
                      isPortionUnselected ? "text-slate-400" : "text-red-600"
                    )}
                  >
                    {isPortionUnselected ? formatPrice(0) : formatPrice(lineTotal)}
                  </p>
                  <p className="min-h-[1rem] truncate text-xs text-slate-500">
                    {isPortionUnselected
                      ? t.tablet.noPortionSelected
                      : activeSize && needsPortionPicker
                        ? t.tablet.portionTimesQty(
                            resolveSizeLabel(activeSize, locale),
                            quantity
                          )
                        : null}
                  </p>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="min-h-11 rounded-xl border-slate-300 px-4 text-sm font-semibold touch-manipulation md:px-5 md:text-base"
                  >
                    {t.common.close}
                  </Button>
                  <Button
                    type="button"
                    disabled={!canShowQuantity}
                    onClick={handleAdd}
                    className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:bg-slate-300 touch-manipulation md:px-5 md:text-base"
                  >
                    {t.tablet.addToCart}
                  </Button>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MenuItemPortionModal
