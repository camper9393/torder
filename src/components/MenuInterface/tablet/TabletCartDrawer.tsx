"use client"

import React from "react"
import { useAppSelector } from "@/hook/redux"
import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import { checkoutLineKey } from "@/utils/menuBilingual"
import { cn } from "@/lib/utils"
import { useTabletPlaceOrder } from "./useTabletPlaceOrder"
import { useTabletCartUi } from "./useTabletCartUi"
import TabletCartDrawerItem from "./TabletCartDrawerItem"
import {
  DEFAULT_TABLET_TEXT_SCALE,
  DEFAULT_TABLET_UI_SCALE,
} from "@/utils/tabletUiScale"
import {
  DEFAULT_TABLET_THEME,
  buildTabletShellCssVars,
  type TabletThemeId,
} from "@/utils/tabletTheme"

type TabletCartDrawerProps = {
  merchantId: string
  uiScale?: number
  textScale?: number
  theme?: TabletThemeId
}

function TabletCartDrawer({
  merchantId,
  uiScale = DEFAULT_TABLET_UI_SCALE,
  textScale = DEFAULT_TABLET_TEXT_SCALE,
  theme = DEFAULT_TABLET_THEME,
}: TabletCartDrawerProps) {
  const { t } = useLocale()
  const { open, closeCart, recentLineKey, openOrderConfirm } = useTabletCartUi()
  const checkout = useAppSelector((state) => state.checkOut.items)
  const { submitting, discountedTotal, itemCount, isEmpty } =
    useTabletPlaceOrder(merchantId)

  const shellStyle = buildTabletShellCssVars(uiScale, textScale, theme)

  const sortedItems = React.useMemo(() => {
    const reversed = [...checkout].reverse()
    if (!recentLineKey) return reversed

    const index = reversed.findIndex(
      (item) => checkoutLineKey(item) === recentLineKey
    )
    if (index <= 0) return reversed

    const recent = reversed[index]
    return [
      recent,
      ...reversed.filter((_, i) => i !== index),
    ]
  }, [checkout, recentLineKey])

  return (
    <>
      <button
        type="button"
        aria-label={t.common.close}
        onClick={closeCart}
        className={cn(
          "tablet-themed-overlay fixed inset-0 z-[100] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        style={shellStyle}
      />

      <aside
        aria-hidden={!open}
        data-tablet-theme={theme}
        className={cn(
          "tablet-cart-drawer tablet-themed-dialog fixed right-0 top-0 z-[101] flex flex-col shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
        style={{
          ...shellStyle,
          bottom: "var(--tablet-bottom-bar-height, 84px)",
        }}
      >
        <header className="tablet-cart-drawer-header tablet-themed-dialog-header flex shrink-0 items-center gap-3">
          <h2 className="tablet-cart-drawer-title min-w-0 flex-1">
            🛒 {t.tablet.cart}
            {itemCount > 0 ? (
              <span className="tablet-themed-muted ml-1 tabular-nums">
                ({itemCount})
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t.common.close}
            className="tablet-cart-drawer-close tablet-themed-dialog-close flex shrink-0 items-center justify-center rounded-lg font-bold transition touch-manipulation"
          >
            ✕
          </button>
        </header>

        <div className="tablet-cart-drawer-list min-h-0 flex-1 overflow-y-auto">
          {isEmpty ? (
            <p className="tablet-cart-drawer-empty tablet-font-cart tablet-themed-muted py-12 text-center">
              {t.tablet.emptyCart}
            </p>
          ) : (
            <ul className="space-y-3">
              {sortedItems.map((item) => {
                const key = checkoutLineKey(item)
                return (
                  <TabletCartDrawerItem
                    key={key}
                    item={item}
                    isRecent={recentLineKey === key}
                  />
                )
              })}
            </ul>
          )}
        </div>

        <footer className="tablet-cart-drawer-footer tablet-themed-dialog-footer shrink-0 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <span className="tablet-cart-drawer-total-label tablet-themed-muted">
              {t.tablet.totalColon}
            </span>
            <span className="tablet-cart-drawer-total-value tabular-nums">
              {formatPrice(discountedTotal)}
            </span>
          </div>
          <button
            type="button"
            onClick={openOrderConfirm}
            disabled={submitting || isEmpty}
            className="tablet-cart-drawer-submit tablet-themed-btn-primary flex w-full items-center justify-center px-4 shadow-md transition disabled:cursor-not-allowed disabled:opacity-45 touch-manipulation"
          >
            {submitting ? t.tablet.placingOrder : t.tablet.submitOrder}
          </button>
        </footer>
      </aside>
    </>
  )
}

export default TabletCartDrawer
