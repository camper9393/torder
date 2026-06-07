"use client"

import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import { useTabletPlaceOrder } from "./useTabletPlaceOrder"
import {
  MOBILE_BOTTOM_NAV_HEIGHT_PX,
  MOBILE_ORDER_BAR_HEIGHT_PX,
  TORDER_BOTTOM_BAR_HEIGHT_PX,
} from "./tabletUi"
import { cn } from "@/lib/utils"
import { useTabletCartUiOptional } from "./useTabletCartUi"

type TabletMobileOrderBarProps = {
  merchantId: string
  variant?: "paper" | "torder"
}

/** Compact fixed order bar on small screens; visibility via CSS only. */
function TabletMobileOrderBar({
  merchantId,
  variant = "paper",
}: TabletMobileOrderBarProps) {
  const { t } = useLocale()
  const cartUi = useTabletCartUiOptional()
  const { placeOrder, submitting, discountedTotal, itemCount, isEmpty } =
    useTabletPlaceOrder(merchantId)

  const isTorder = variant === "torder"
  const bottomOffset = isTorder
    ? TORDER_BOTTOM_BAR_HEIGHT_PX
    : MOBILE_BOTTOM_NAV_HEIGHT_PX

  return (
    <div
      role="region"
      aria-label={t.tablet.cart}
      className={cn(
        "fixed left-0 right-0 z-[9999] flex border-t",
        isTorder
          ? "border-black/10 bg-white md:hidden"
          : "border-[#c9a227]/40 bg-[#121110] shadow-[0_-8px_24px_rgba(0,0,0,0.55)] xl:hidden"
      )}
      style={{
        bottom: bottomOffset,
        height: MOBILE_ORDER_BAR_HEIGHT_PX,
      }}
    >
      <div className="flex h-full w-full items-center gap-2.5 px-3">
        <div className="min-w-0 flex-1 leading-tight">
          <p
            className={cn(
              "text-[10px] font-medium uppercase tracking-wide",
              isTorder ? "text-slate-500" : "text-[#8a7344]"
            )}
          >
            {t.common.total}
          </p>
          <p
            className={cn(
              "text-base font-bold",
              isTorder ? "text-black" : "text-[#c9a227]"
            )}
          >
            {formatPrice(discountedTotal)}
          </p>
          <p
            className={cn(
              "text-[10px]",
              isTorder ? "text-slate-500" : "text-[#8a7344]"
            )}
          >
            {itemCount} {t.common.items}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isTorder && cartUi) {
              cartUi.openOrderConfirm()
              return
            }
            placeOrder()
          }}
          disabled={submitting || isEmpty}
          className={cn(
            "flex h-[52px] max-h-[52px] min-h-[52px] shrink-0 items-center justify-center rounded-xl border px-4 text-sm font-bold leading-tight transition active:scale-[0.98] disabled:cursor-not-allowed touch-manipulation sm:min-w-[9.5rem]",
            isTorder
              ? "border-[#111111] bg-[#111111] text-white hover:bg-black disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
              : "border-[#c9a227] bg-gradient-to-b from-[#c9a227] to-[#8a7344] text-[#121110] disabled:border-[#8a7344]/30 disabled:from-[#2a2622] disabled:to-[#1c1916] disabled:text-[#8a7344] disabled:shadow-none"
          )}
        >
          {submitting ? t.tablet.placingOrder : t.tablet.submitOrder}
        </button>
      </div>
    </div>
  )
}

export default TabletMobileOrderBar
