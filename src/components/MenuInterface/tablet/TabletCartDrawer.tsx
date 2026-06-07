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
import { TORDER_BOTTOM_BAR_HEIGHT_PX } from "./tabletUi"

type TabletCartDrawerProps = {
  merchantId: string
}

function TabletCartDrawer({ merchantId }: TabletCartDrawerProps) {
  const { t } = useLocale()
  const { open, closeCart, recentLineKey, openOrderConfirm } = useTabletCartUi()
  const checkout = useAppSelector((state) => state.checkOut.items)
  const { submitting, discountedTotal, itemCount, isEmpty } =
    useTabletPlaceOrder(merchantId)

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
          "fixed inset-0 z-[100] bg-black/40 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        aria-hidden={!open}
        className={cn(
          "fixed right-0 top-0 z-[101] flex w-[min(400px,92vw)] min-w-[320px] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
        style={{
          bottom: TORDER_BOTTOM_BAR_HEIGHT_PX,
        }}
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-4 py-3">
          <h2 className="min-w-0 flex-1 text-base font-bold text-slate-900">
            🛒 {t.tablet.cart}
            {itemCount > 0 ? (
              <span className="ml-1 tabular-nums text-slate-600">
                ({itemCount})
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t.common.close}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-600 transition hover:bg-slate-50 touch-manipulation"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {isEmpty ? (
            <p className="py-12 text-center text-sm text-slate-500">
              {t.tablet.emptyCart}
            </p>
          ) : (
            <ul className="space-y-2">
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

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-slate-700">
              {t.tablet.totalColon}
            </span>
            <span className="text-xl font-extrabold tabular-nums text-slate-900">
              {formatPrice(discountedTotal)}
            </span>
          </div>
          <button
            type="button"
            onClick={openOrderConfirm}
            disabled={submitting || isEmpty}
            className="flex min-h-14 w-full items-center justify-center rounded-xl bg-red-600 px-4 text-base font-bold text-white shadow-md transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none touch-manipulation"
          >
            {submitting ? t.tablet.placingOrder : t.tablet.submitOrder}
          </button>
        </footer>
      </aside>
    </>
  )
}

export default TabletCartDrawer
