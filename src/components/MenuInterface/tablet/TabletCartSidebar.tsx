"use client"

import { useLocale } from "@/context/LocaleContext"
import { formatPrice } from "@/utils/currency"
import CheckOutItem from "@/components/Checkout/CheckOutItem"
import { ShoppingCart } from "lucide-react"
import { PAPER_WAVE_BORDER_CLASS } from "./paperMenuAssets"
import { useTabletPlaceOrder } from "./useTabletPlaceOrder"
import { useAppSelector } from "@/hook/redux"
import { CheckOutItems } from "@/store/reducer/checkout"

const SIDEBAR_HEIGHT = "calc(100vh - 4.75rem)"

type TabletCartSidebarProps = {
  merchantId: string
}

function TabletCartSidebar({ merchantId }: TabletCartSidebarProps) {
  const { t } = useLocale()
  const checkout = useAppSelector((state) => state.checkOut.items)
  const {
    placeOrder,
    submitting,
    discountedTotal,
    itemCount,
    isEmpty,
  } = useTabletPlaceOrder(merchantId)

  const originalTotal = checkout.reduce(
    (sum, item) =>
      sum + (item.originalPrice ?? item.price) * item.itemCount,
    0
  )

  const savings = originalTotal - discountedTotal

  return (
    <aside
      className="hidden w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-l border-[#c9a227]/25 bg-[#1a1714]/95 shadow-[-8px_0_32px_rgba(0,0,0,0.5)] xl:grid"
      style={{ height: SIDEBAR_HEIGHT, maxHeight: SIDEBAR_HEIGHT }}
    >
      <header className="relative border-b border-[#c9a227]/25 px-4 py-4">
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 opacity-40 ${PAPER_WAVE_BORDER_CLASS}`}
          aria-hidden
        />
        <div className="relative flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 shrink-0 text-[#c9a227]" aria-hidden />
          <h2 className="font-serif text-lg font-bold text-[#e8d4a8]">
            {t.tablet.cart}
          </h2>
          {itemCount > 0 && (
            <span className="ml-auto flex h-7 min-w-7 items-center justify-center rounded-full border border-[#c9a227] bg-[#c9a227] px-2 text-xs font-bold text-[#121110]">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </div>
      </header>

      <div className="min-h-0 overflow-y-auto overscroll-contain px-3 py-3 pb-2">
        {isEmpty ? (
          <p className="px-2 py-8 text-center text-sm text-[#8a7344]">
            {t.tablet.emptyCart}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {checkout.map((item: CheckOutItems) => (
              <li key={String(item._id)}>
                <CheckOutItem item={item} compact paper />
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="z-10 shrink-0 border-t border-[#c9a227]/25 bg-[#121110] px-4 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
        <div className="mb-3 space-y-1.5">
          {savings > 0 && (
            <>
              <div className="flex justify-between text-xs text-[#8a7344]">
                <span>{t.common.subtotal}</span>
                <span className="line-through">
                  {formatPrice(originalTotal)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-emerald-500/90">
                <span>{t.common.savings}</span>
                <span>{formatPrice(savings)}</span>
              </div>
            </>
          )}
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-[#e8d4a8]">
              {t.common.total}
            </span>
            <span className="text-xl font-bold text-[#c9a227]">
              {formatPrice(discountedTotal)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={placeOrder}
          disabled={submitting || isEmpty}
          aria-disabled={submitting || isEmpty}
          className="flex min-h-14 w-full items-center justify-center rounded-2xl border border-[#c9a227] bg-gradient-to-b from-[#c9a227] to-[#8a7344] px-4 text-base font-bold text-[#121110] shadow-[0_4px_20px_rgba(201,162,39,0.35)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:border-[#8a7344]/30 disabled:from-[#2a2622] disabled:to-[#1c1916] disabled:text-[#8a7344] disabled:shadow-none touch-manipulation"
        >
          {submitting ? t.tablet.placingOrder : t.tablet.placeOrder}
        </button>
      </footer>
    </aside>
  )
}

export default TabletCartSidebar
