"use client"

import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { useAppSelector } from "@/hook/redux"
import { formatPrice } from "@/utils/currency"
import { checkoutLineKey } from "@/utils/menuBilingual"
import { useLocale } from "@/context/LocaleContext"
import { cn } from "@/lib/utils"
import TabletOrderConfirmLine from "./TabletOrderConfirmLine"

type TabletOrderConfirmModalProps = {
  open: boolean
  submitting: boolean
  onClose: () => void
  onConfirm: () => void
}

function TabletOrderConfirmModal({
  open,
  submitting,
  onClose,
  onConfirm,
}: TabletOrderConfirmModalProps) {
  const { t } = useLocale()
  const checkout = useAppSelector((state) => state.checkOut.items)

  const itemCount = checkout.reduce((sum, item) => sum + item.itemCount, 0)
  const total = checkout.reduce(
    (sum, item) => sum + item.price * item.itemCount,
    0
  )

  if (typeof document === "undefined" || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.common.close}
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[min(85vh,760px)] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="shrink-0 border-b border-slate-200 px-5 py-4">
          <h2 className="text-center text-lg font-bold leading-snug text-slate-900 md:text-xl">
            {t.tablet.reviewOrderPrompt}
          </h2>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
          {checkout.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              {t.tablet.emptyCart}
            </p>
          ) : (
            <ul>
              {checkout.map((item) => (
                <TabletOrderConfirmLine
                  key={checkoutLineKey(item)}
                  item={item}
                />
              ))}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <div className="mb-4 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="font-medium text-slate-600">
                {t.tablet.totalCountLabel}
              </span>
              <span className="font-bold tabular-nums text-slate-900">
                {itemCount}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="font-medium text-slate-600">
                {t.tablet.totalPriceLabel}
              </span>
              <span className="text-lg font-extrabold tabular-nums text-slate-900">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onClose}
              className="min-h-12 rounded-xl border-slate-300 text-base font-semibold touch-manipulation"
            >
              {t.tablet.back}
            </Button>
            <Button
              type="button"
              disabled={submitting || checkout.length === 0}
              onClick={onConfirm}
              className={cn(
                "min-h-12 rounded-xl bg-red-600 text-base font-bold text-white hover:bg-red-700 disabled:bg-slate-300 touch-manipulation"
              )}
            >
              {submitting ? t.tablet.placingOrder : t.tablet.submitOrder}
            </Button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  )
}

export default TabletOrderConfirmModal
