"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { KitchenOrder } from "@/types/kitchenOrder"
import { Printer } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TablePaymentReceiptData } from "@/utils/tablePayment"
import { buildReceiptRenderData } from "@/components/receipt/buildReceiptRenderData"
import ReceiptDocument from "@/components/receipt/ReceiptDocument"
import {
  buildReceiptContextParams,
  useReceiptRestaurantId,
} from "@/components/receipt/useReceiptRestaurantId"
import { useReceiptSettings } from "@/components/receipt/useReceiptSettings"
import { useLocale } from "@/context/LocaleContext"
import { formatOrderItemLine } from "@/utils/menuBilingual"
import { resolveLineItemQuantity } from "@/utils/orderTotals"
import { labelOrderStatus } from "@/utils/i18n/orderStatus"

type BillReceiptModalProps = {
  open: boolean
  onClose: () => void
  order: KitchenOrder | null
  restaurantName: string
  merchantId?: string
  tableRestaurantId?: string
  onCloseTable?: () => void | Promise<void>
  closeTableLabel?: string
  confirmCloseTable?: string
  closingTable?: boolean
  payment?: TablePaymentReceiptData | null
  onFinish?: () => void
  finishLabel?: string
  showQrPlaceholder?: boolean
}

function BillReceiptModal({
  open,
  onClose,
  order,
  restaurantName,
  merchantId,
  tableRestaurantId,
  onCloseTable,
  closeTableLabel = "Close Table",
  confirmCloseTable = "Are you sure you want to close this table?",
  closingTable = false,
  payment = null,
  onFinish,
  finishLabel = "Дуусгах",
  showQrPlaceholder = false,
}: BillReceiptModalProps) {
  const { t, locale, dateLocale } = useLocale()
  const c = t.common

  const { restaurantId: resolvedRestaurantId, ready: restaurantIdReady } =
    useReceiptRestaurantId({
      enabled: open,
      orderRestaurantId: order?.restaurantId,
      tableRestaurantId,
    })

  const receiptApiParams = React.useMemo(
    () =>
      buildReceiptContextParams({
        restaurantId: resolvedRestaurantId,
        merchantId,
      }),
    [resolvedRestaurantId, merchantId]
  )

  const { settings, company, loading, error } = useReceiptSettings(
    open && restaurantIdReady,
    receiptApiParams,
    { source: "print" }
  )

  const handlePrint = () => {
    window.print()
  }

  const handleCloseTable = async () => {
    if (!onCloseTable) return
    if (!window.confirm(confirmCloseTable)) return
    await onCloseTable()
  }

  const isPaidReceipt = Boolean(payment)

  const receiptData = React.useMemo(() => {
    if (!order || loading || !restaurantIdReady) return null
    return buildReceiptRenderData({
      order,
      payment,
      company,
      settings,
      fallbackRestaurantName: restaurantName,
      dateLocale,
      formatItemName: (item, qty) =>
        formatOrderItemLine(item, locale, qty || resolveLineItemQuantity(item)),
      orderStatusLabel: labelOrderStatus(order.status, locale),
    })
  }, [
    order,
    loading,
    restaurantIdReady,
    payment,
    company,
    settings,
    restaurantName,
    dateLocale,
    locale,
  ])

  const effectiveSettings = React.useMemo(() => {
    if (!showQrPlaceholder || settings.showDeliveryQr) {
      return settings
    }
    return {
      ...settings,
      showDeliveryQr: payment?.paymentMethod === "QPay",
    }
  }, [settings, showQrPlaceholder, payment?.paymentMethod])

  const sizeClass =
    effectiveSettings.receiptSize === "58mm"
      ? "receipt-size-58mm"
      : "receipt-size-80mm"

  const isSettingsLoading = loading || !restaurantIdReady

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          "kitchen-bill-dialog max-w-md print:max-w-none",
          sizeClass
        )}
      >
        <DialogTitle className="bill-receipt-actions sr-only">
          {c.billReceipt}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isPaidReceipt ? "Төлбөрийн баримт" : "Захиалгын баримт"}
        </DialogDescription>

        {isSettingsLoading || !receiptData ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Баримт ачааллаж байна...
          </p>
        ) : (
          <>
            {error ? (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {error}
              </p>
            ) : null}

            <div className="bill-receipt-actions mb-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handlePrint}
                className="min-h-12 bg-green-600 px-4 text-base text-white hover:bg-green-700 touch-manipulation"
              >
                <Printer className="mr-2 h-5 w-5" aria-hidden />
                {isPaidReceipt ? "Хэвлэх" : c.print}
              </Button>
              {isPaidReceipt && onCloseTable ? (
                <Button
                  type="button"
                  disabled={closingTable}
                  onClick={handleCloseTable}
                  className={cn(
                    "min-h-12 rounded-xl bg-red-600 px-5 text-base font-bold text-white shadow-md",
                    "hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 touch-manipulation print:hidden"
                  )}
                >
                  {closingTable ? c.loading : closeTableLabel}
                </Button>
              ) : null}
              {isPaidReceipt && onFinish ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onFinish}
                  className="min-h-12 px-4 text-base touch-manipulation print:hidden"
                >
                  {finishLabel}
                </Button>
              ) : null}
              {!isPaidReceipt ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="min-h-12 px-4 text-base touch-manipulation"
                >
                  {c.close}
                </Button>
              ) : null}
              {!isPaidReceipt && onCloseTable && (
                <Button
                  type="button"
                  disabled={closingTable}
                  onClick={handleCloseTable}
                  className={cn(
                    "ml-auto min-h-12 rounded-xl bg-red-600 px-5 text-base font-bold text-white shadow-md",
                    "hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 touch-manipulation print:hidden"
                  )}
                >
                  {closingTable ? c.loading : closeTableLabel}
                </Button>
              )}
            </div>

            <div
              id="kitchen-bill-receipt"
              className={cn("kitchen-bill-receipt", sizeClass)}
            >
              <ReceiptDocument settings={effectiveSettings} data={receiptData} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default BillReceiptModal
