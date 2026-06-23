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

import type { RootState } from "@/store/store"



type MenuGridItemProps = {

  item: IMenu

  itemNumber: number

  variant?: "paper" | "torder"

}



function selectItemQuantity(state: RootState, itemId: string): number {

  let total = 0

  for (const line of state.checkOut.items) {

    if (String(line._id) === itemId) {

      total += line.itemCount

    }

  }

  return total

}



function MenuCardBadgeRibbon({ badge }: { badge: MenuCardBadge }) {

  if (badge !== "BEST") return null



  return (

    <div

      className="pointer-events-none absolute left-0 top-0 z-20 h-16 w-16 overflow-hidden"

      aria-hidden

    >

      <span className="absolute left-[-28px] top-[14px] flex w-[110px] -rotate-45 items-center justify-center tablet-best-ribbon py-1 text-[10px] font-extrabold tracking-wider text-white">

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

  itemNumber,

  variant = "torder",

}: MenuGridItemProps) {

  const dispatch = useAppDispatch()

  const { locale } = useLocale()

  const cartUi = useTabletCartUiOptional()

  const itemId = String(rawItem._id)

  const totalQty = useAppSelector((state) => selectItemQuantity(state, itemId))

  const item = normalizeMenuDocument(rawItem)

  const [modalOpen, setModalOpen] = React.useState(false)

  const badges = resolveMenuCardBadges(rawItem)

  const loadImageEager = itemNumber <= 6



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

              priority={loadImageEager}

              loading={loadImageEager ? "eager" : "lazy"}

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

          "tablet-menu-item-card group flex min-h-0 cursor-pointer flex-col overflow-hidden rounded-xl p-2 transition touch-manipulation",

          totalQty > 0 && "is-in-cart"

        )}

      >

        <div className="tablet-menu-item-image relative w-full shrink-0 overflow-hidden rounded-lg">

          <Image

            alt={displayName}

            src={item.image}

            fill

            crossOrigin="anonymous"

            className="!h-full !w-full object-cover object-center"

            sizes="(max-width: 768px) 50vw, 33vw"

            priority={loadImageEager}

            loading={loadImageEager ? "eager" : "lazy"}

          />

          {badges.includes("BEST") ? (

            <MenuCardBadgeRibbon badge="BEST" />

          ) : null}

          <MenuCardBadgePills badges={badges} />

          <SpicyMenuBadge level={spicyLevel} compact className="!left-1.5 !top-1.5" />

          {totalQty > 0 ? (

            <span className="tablet-cart-qty-badge absolute right-2 top-2 z-10 flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs font-bold">

              {totalQty}

            </span>

          ) : null}

        </div>



        <div className="tablet-menu-item-body flex shrink-0 items-start justify-between gap-2 px-1 pb-1 pt-2">

          <h3 className="tablet-menu-item-name tablet-font-food-name line-clamp-2 min-w-0 flex-1 text-left font-bold leading-tight">

            {displayName}

          </h3>

          <p className="tablet-menu-item-price tablet-font-price shrink-0 text-right font-black tabular-nums">

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



export default React.memo(MenuGridItem)


