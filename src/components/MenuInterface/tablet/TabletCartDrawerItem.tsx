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
        "tablet-cart-drawer-item rounded-xl",
        isRecent ? "is-recent" : ""
      )}
    >
      {isRecent ? (
        <p className="tablet-cart-drawer-recent-badge font-bold uppercase tracking-wide" style={{ color: "var(--tablet-accent)" }}>
          {t.tablet.recentlyAdded}
        </p>
      ) : null}

      <div className="tablet-cart-drawer-item-top">
        <div className="tablet-cart-drawer-item-image relative shrink-0 overflow-hidden rounded-lg">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={displayName}
              fill
              className="object-cover"
              sizes="76px"
            />
          ) : (
            <div className="tablet-themed-muted flex h-full w-full items-center justify-center">
              <ImagePlus className="h-6 w-6" aria-hidden />
            </div>
          )}
        </div>

        <div className="tablet-cart-drawer-item-heading">
          <p className="tablet-cart-drawer-item-name">{displayName}</p>
          {portionLabel ? (
            <p className="tablet-cart-drawer-item-portion tablet-themed-muted font-medium">
              {portionLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="tablet-cart-drawer-item-controls">
        <div className="tablet-cart-drawer-item-controls-inner">
          <button
            type="button"
            onClick={handleDecrease}
            aria-label={t.tablet.decreaseQty}
            className="tablet-cart-drawer-qty-btn flex items-center justify-center rounded-lg transition touch-manipulation"
          >
            <Minus aria-hidden />
          </button>
          <span className="tablet-cart-drawer-qty-value text-center tabular-nums">
            {item.itemCount}
          </span>
          <button
            type="button"
            onClick={handleIncrease}
            aria-label={t.tablet.increaseQty}
            className="tablet-cart-drawer-qty-btn flex items-center justify-center rounded-lg transition touch-manipulation"
          >
            <Plus aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            aria-label={t.tablet.removeItem}
            className="tablet-cart-drawer-delete-btn flex items-center justify-center rounded-lg transition touch-manipulation"
          >
            <Trash2 aria-hidden />
          </button>
        </div>
      </div>

      <div className="tablet-cart-drawer-item-price-row">
        <span className="tablet-cart-drawer-item-line-price tabular-nums">
          {formatPrice(lineTotal)}
        </span>
      </div>
    </li>
  )
}

export default TabletCartDrawerItem
