"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { KitchenOrder } from "@/types/kitchenOrder"
import { Printer } from "lucide-react"
import { formatPrice } from "@/utils/currency"
import {
  computeLineItemSubtotal,
  computeOrderTotal,
  resolveLineItemQuantity,
} from "@/utils/orderTotals"
import { labelOrderStatus } from "@/utils/i18n/orderStatus"
import { useLocale } from "@/context/LocaleContext"
import { formatOrderItemLine } from "@/utils/menuBilingual"
import { cn } from "@/lib/utils"

type BillReceiptModalProps = {
  open: boolean
  onClose: () => void
  order: KitchenOrder | null
  restaurantName: string
  /** Admin tables: close table after checkout */
  onCloseTable?: () => void | Promise<void>
  closeTableLabel?: string
  confirmCloseTable?: string
  closingTable?: boolean
}

function BillReceiptModal({
  open,
  onClose,
  order,
  restaurantName,
  onCloseTable,
  closeTableLabel = "Close Table",
  confirmCloseTable = "Are you sure you want to close this table?",
  closingTable = false,
}: BillReceiptModalProps) {
  const { t, locale, dateLocale } = useLocale()
  const c = t.common

  const handlePrint = () => {
    window.print()
  }

  const handleCloseTable = async () => {
    if (!onCloseTable) return
    if (!window.confirm(confirmCloseTable)) return
    await onCloseTable()
  }

  if (!order) return null

  const receiptItems = order.items
  const receiptTotal = computeOrderTotal(receiptItems)
  const orderIdShort = String(order._id).slice(-8).toUpperCase()

  const formatReceiptDate = (value: string) =>
    new Date(value).toLocaleString(dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
    })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="kitchen-bill-dialog max-w-md print:max-w-none">
        <DialogTitle className="bill-receipt-actions sr-only">
          {c.billReceipt}
        </DialogTitle>

        <div className="bill-receipt-actions mb-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handlePrint}
            className="min-h-12 bg-green-600 px-4 text-base text-white hover:bg-green-700 touch-manipulation"
          >
            <Printer className="mr-2 h-5 w-5" aria-hidden />
            {c.print}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-h-12 px-4 text-base touch-manipulation"
          >
            {c.close}
          </Button>
          {onCloseTable && (
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

        <div id="kitchen-bill-receipt" className="kitchen-bill-receipt">
          <div className="receipt-inner">
            <p className="receipt-title">{restaurantName}</p>
            <p className="receipt-sub">{c.taxInvoiceBill}</p>
            <div className="receipt-divider" />

            <p className="receipt-row">
              <span>{c.table}</span>
              <span>{order.tableName}</span>
            </p>
            <p className="receipt-row">
              <span>{c.orderId}</span>
              <span>#{orderIdShort}</span>
            </p>
            <p className="receipt-row">
              <span>{c.date}</span>
              <span>{formatReceiptDate(order.createdAt)}</span>
            </p>
            <p className="receipt-row">
              <span>{c.status}</span>
              <span>{labelOrderStatus(order.status, locale)}</span>
            </p>

            <div className="receipt-divider" />
            <p className="receipt-items-head">{c.items}</p>

            <ul className="receipt-items">
              {receiptItems.map((item, idx) => (
                <li key={idx} className="receipt-item">
                  <span className="receipt-item-name">
                    {formatOrderItemLine(
                      item,
                      locale,
                      resolveLineItemQuantity(item)
                    )}
                  </span>
                  <span className="receipt-item-price">
                    {formatPrice(computeLineItemSubtotal(item))}
                  </span>
                </li>
              ))}
            </ul>

            <div className="receipt-divider" />
            <p className="receipt-total">
              <span>{c.total}</span>
              <span>{formatPrice(receiptTotal)}</span>
            </p>

            <div className="receipt-divider" />
            <p className="receipt-footer">{c.thankYou}</p>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}

export default BillReceiptModal
