"use client"

import Image from "next/image"
import { ImagePlus, Minus, Plus } from "lucide-react"
import React from "react"
import { createPortal } from "react-dom"

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
import { useTabletCartUiOptional } from "./useTabletCartUi"
import {
  DEFAULT_TABLET_TEXT_SCALE,
  DEFAULT_TABLET_UI_SCALE,
} from "@/utils/tabletUiScale"
import {
  buildTabletShellCssVars,
  DEFAULT_TABLET_THEME,
} from "@/utils/tabletTheme"

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
      <span className="absolute left-[-30px] top-[18px] flex w-[120px] -rotate-45 items-center justify-center tablet-best-ribbon py-1.5 text-xs font-extrabold tracking-wider text-white shadow-md">
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
  const cartUi = useTabletCartUiOptional()
  const uiScale = cartUi?.uiScale ?? DEFAULT_TABLET_UI_SCALE
  const textScale = cartUi?.textScale ?? DEFAULT_TABLET_TEXT_SCALE
  const theme = cartUi?.theme ?? DEFAULT_TABLET_THEME
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

  if (typeof document === "undefined" || !open) return null

  return createPortal(
    <div className="tablet-item-modal-root fixed inset-0 z-[150] flex items-center justify-center" data-tablet-theme={theme}>
      <button
        type="button"
        aria-label={t.common.close}
        className="tablet-themed-modal-backdrop absolute inset-0"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tablet-item-modal-title"
        className="tablet-item-modal"
        style={buildTabletShellCssVars(uiScale, textScale, theme)}
      >
        <div className="tablet-item-modal-panel">
          <div className="tablet-item-modal-media">
            <div className="tablet-item-modal-image-wrap">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={displayName}
                  fill
                  className="tablet-item-modal-image"
                  sizes="(max-width: 900px) 92vw, 42vw"
                  crossOrigin="anonymous"
                  priority
                />
              ) : (
                <div className="tablet-item-modal-image-placeholder">
                  <ImagePlus className="h-12 w-12" aria-hidden />
                </div>
              )}
              {badges.includes("BEST") ? <BestRibbon /> : null}
              <BadgePills badges={badges} />
              <SpicyMenuBadge
                level={normalizeSpicyLevel(item.spicyLevel, item.spicy)}
                className="!right-3 !left-auto !top-3"
              />
            </div>
          </div>

          <div className="tablet-item-modal-content">
            <div className="tablet-item-modal-scroll">
              <h2 id="tablet-item-modal-title" className="tablet-item-modal-title">
                {displayName}
              </h2>
              {description ? (
                <p className="tablet-item-modal-description">{description}</p>
              ) : null}

              {needsPortionPicker ? (
                <div className="tablet-item-modal-section space-y-2">
                  <p className="tablet-item-modal-section-label">
                    {t.tablet.selectPortion}
                  </p>
                  <div className="tablet-item-modal-options">
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
                            "tablet-item-modal-option",
                            isSelected && "is-selected"
                          )}
                        >
                          <span className="tablet-item-modal-option-label">
                            {label}
                          </span>
                          <span
                            className={cn(
                              "tablet-item-modal-option-price",
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
                <div className="tablet-item-modal-section space-y-2">
                  <p className="tablet-item-modal-section-label">
                    {t.tablet.extraOptions}
                  </p>
                  <div className="tablet-item-modal-toppings">
                    {toppings.map((topping, idx) => {
                      const label = resolveToppingLabel(topping, locale)
                      if (!label) return null
                      return (
                        <span key={`${label}-${idx}`} className="tablet-item-modal-topping">
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
                <div className="tablet-item-modal-section space-y-2">
                  <p className="tablet-item-modal-section-label">
                    {t.tablet.quantity}
                  </p>
                  <div className="tablet-item-modal-qty-row">
                    <button
                      type="button"
                      aria-label={t.tablet.decreaseQty}
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="tablet-item-modal-qty-btn"
                    >
                      <Minus aria-hidden />
                    </button>
                    <span className="tablet-item-modal-qty-value">{quantity}</span>
                    <button
                      type="button"
                      aria-label={t.tablet.increaseQty}
                      onClick={() => setQuantity((q) => q + 1)}
                      className="tablet-item-modal-qty-btn"
                    >
                      <Plus aria-hidden />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <footer className="tablet-item-modal-footer">
              <div className="tablet-item-modal-footer-inner">
                <div className="min-w-0">
                  <p className="tablet-item-modal-total-label">
                    {t.tablet.selectedTotal}
                  </p>
                  <p
                    className={cn(
                      "tablet-item-modal-total-value",
                      isPortionUnselected ? "is-muted" : "is-active"
                    )}
                  >
                    {isPortionUnselected ? formatPrice(0) : formatPrice(lineTotal)}
                  </p>
                  <p className="tablet-item-modal-total-hint">
                    {isPortionUnselected
                      ? t.tablet.noPortionSelected
                      : activeSize && needsPortionPicker
                        ? t.tablet.portionTimesQty(
                            resolveSizeLabel(activeSize, locale),
                            quantity
                          )
                        : "\u00a0"}
                  </p>
                </div>

                <div className="tablet-item-modal-actions">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="tablet-item-modal-btn tablet-item-modal-btn-secondary"
                  >
                    {t.common.close}
                  </button>
                  <button
                    type="button"
                    disabled={!canShowQuantity}
                    onClick={handleAdd}
                    className="tablet-item-modal-btn tablet-item-modal-btn-primary"
                  >
                    {t.tablet.addToCart}
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default MenuItemPortionModal
