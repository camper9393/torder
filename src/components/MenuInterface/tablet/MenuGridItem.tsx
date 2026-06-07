"use client"

import { useAppDispatch, useAppSelector } from "@/hook/redux"
import { addCheckOutItem, type CheckOutItems } from "@/store/reducer/checkout"
import { formatPrice } from "@/utils/currency"
import { IMenu } from "@/types/menu"
import Image from "next/image"
import React from "react"
import { useLocale } from "@/context/LocaleContext"
import { normalizeSpicyLevel } from "@/utils/menuSpicy"
import { SpicyMenuBadge } from "@/components/MenuInterface/SpicyMenuBadge"
import { cn } from "@/lib/utils"
import {
  normalizeMenuDocument,
  resolveMenuName,
} from "@/utils/menuBilingual"
import MenuItemPortionModal from "./MenuItemPortionModal"
import { useTabletCartUiOptional } from "./useTabletCartUi"
import {
  MENU_BADGE_STYLES,
  resolveMenuCardBadges,
  type MenuCardBadge,
} from "./menuCardBadges"

type MenuGridItemProps = {
  item: IMenu
  itemNumber: number
  variant?: "paper" | "torder"
}

function MenuCardBadgeRibbon({ badge }: { badge: MenuCardBadge }) {
  if (badge !== "BEST") return null

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-20 h-16 w-16 overflow-hidden"
      aria-hidden
    >
      <span className="absolute left-[-28px] top-[14px] flex w-[110px] -rotate-45 items-center justify-center bg-[#e53935] py-1 text-[10px] font-extrabold tracking-wider text-white">
        BEST
      </span>
    </div>
  )
}

function MenuCardBadgePills({ badges }: { badges: MenuCardBadge[] }) {
  const pills = badges.filter((b) => b !== "BEST")
  if (pills.length === 0) return null

  return (
    <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex flex-wrap gap-1">
      {pills.map((badge) => (
        <span
          key={badge}
          className={cn(
            "rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide shadow-sm",
            MENU_BADGE_STYLES[badge].pill
          )}
        >
          {MENU_BADGE_STYLES[badge].label}
        </span>
      ))}
    </div>
  )
}

function MenuGridItem({
  item: rawItem,
  itemNumber: _itemNumber,
  variant = "torder",
}: MenuGridItemProps) {
  const dispatch = useAppDispatch()
  const { locale } = useLocale()
  const cartUi = useTabletCartUiOptional()
  const checkout = useAppSelector((state) => state.checkOut.items)
  const item = normalizeMenuDocument(rawItem)
  const [modalOpen, setModalOpen] = React.useState(false)
  const badges = resolveMenuCardBadges(rawItem)

  const linesInCart = checkout.filter((c) => String(c._id) === String(item._id))
  const totalQty = linesInCart.reduce((sum, l) => sum + l.itemCount, 0)

  const displayName = resolveMenuName(item, locale)
  const priceLabel = formatPrice(item.price)
  const spicyLevel = normalizeSpicyLevel(item.spicyLevel, item.spicy)

  const openModal = (e?: React.SyntheticEvent) => {
    e?.stopPropagation()
    setModalOpen(true)
  }

  const handleAddToCart = (line: CheckOutItems) => {
    dispatch(addCheckOutItem(line))
    if (variant === "torder") {
      cartUi?.notifyItemAdded(line, displayName)
    }
  }

  if (variant === "paper") {
    return (
      <>
        <article
          role="button"
          tabIndex={0}
          onClick={openModal}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              openModal()
            }
          }}
          className="flex cursor-pointer flex-col rounded-2xl border border-[#c9a227]/30 bg-[#1c1916]/90 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition active:scale-[0.98] touch-manipulation"
        >
          <div className="relative mx-auto mb-3 aspect-square w-full max-w-[140px] overflow-hidden rounded-full bg-[#0f0e0d]">
            <Image
              alt={displayName}
              src={item.image}
              fill
              crossOrigin="anonymous"
              className="object-cover"
              sizes="140px"
            />
          </div>
          <h3 className="text-center font-serif text-lg font-bold text-[#f3e8cf]">
            {displayName}
          </h3>
          <p className="mt-1 text-center text-xl font-bold text-[#c9a227]">
            {priceLabel}
          </p>
        </article>
        <MenuItemPortionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          item={rawItem}
          onAddToCart={handleAddToCart}
        />
      </>
    )
  }

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={openModal}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openModal()
          }
        }}
        className={cn(
          "group flex min-h-[44px] cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 transition touch-manipulation md:p-1.5",
          "active:scale-[0.98]",
          totalQty > 0 && "border-[#e53935]/40 ring-1 ring-[#e53935]/25"
        )}
      >
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-md bg-neutral-100 md:rounded-lg">
          <Image
            alt={displayName}
            src={item.image}
            fill
            crossOrigin="anonymous"
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          {badges.includes("BEST") ? (
            <MenuCardBadgeRibbon badge="BEST" />
          ) : null}
          <MenuCardBadgePills badges={badges} />
          <SpicyMenuBadge level={spicyLevel} compact className="!left-1.5 !top-1.5" />
          {totalQty > 0 ? (
            <span className="absolute right-2 top-2 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#e53935] px-1.5 text-xs font-bold text-white">
              {totalQty}
            </span>
          ) : null}
        </div>

        <div className="flex items-start justify-between gap-1 border-t border-neutral-100 px-0.5 pb-0.5 pt-1">
          <h3 className="line-clamp-2 min-h-[2.25rem] min-w-0 flex-1 text-left text-sm font-bold leading-tight text-black md:min-h-[2.5rem] md:text-[15px]">
            {displayName}
          </h3>
          <p className="shrink-0 text-right text-base font-black tabular-nums text-black md:text-lg">
            {priceLabel}
          </p>
        </div>
      </article>

      <MenuItemPortionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={rawItem}
        onAddToCart={handleAddToCart}
      />
    </>
  )
}

export default MenuGridItem
