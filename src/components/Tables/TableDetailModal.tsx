"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TableDetail } from "@/types/table"
import { KitchenOrder } from "@/types/kitchenOrder"
import { formatPrice } from "@/utils/currency"
import { labelOrderStatus } from "@/utils/i18n/orderStatus"
import { useLocale } from "@/context/LocaleContext"
import { tableStatusCardStyles } from "@/utils/tableStatusStyles"
import { cn } from "@/lib/utils"
import { Receipt } from "lucide-react"
import BillReceiptModal from "@/components/Kitchen/BillReceiptModal"

type TableDetailModalProps = {
  open: boolean
  detail: TableDetail | null
  restaurantName: string
  closing: boolean
  onClose: () => void
  onCloseTable: () => void
}

function TableDetailModal({
  open,
  detail,
  restaurantName,
  closing,
  onClose,
  onCloseTable,
}: TableDetailModalProps) {
  const { t, locale, dateLocale } = useLocale()
  const tbl = t.tables
  const k = t.kitchen
  const [printOrder, setPrintOrder] = React.useState<KitchenOrder | null>(null)

  React.useEffect(() => {
    if (!open) setPrintOrder(null)
  }, [open])

  if (!detail) return null

  const styles = tableStatusCardStyles[detail.status]
  const statusLabel = tbl.status[detail.status]
  const canClose = detail.activeOrderCount > 0

  return (
    <>
      <BillReceiptModal
        open={printOrder !== null}
        onClose={() => setPrintOrder(null)}
        order={printOrder}
        restaurantName={restaurantName}
      />

      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {detail.tableName}
          </DialogTitle>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge className={styles.badge}>{statusLabel}</Badge>
            <span className="text-sm text-gray-600">
              {tbl.orderCount}: {detail.activeOrderCount} · {t.common.total}:{" "}
              {formatPrice(detail.totalAmount)}
            </span>
          </div>

          {detail.orders.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{tbl.noActiveOrders}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {detail.orders.map((order) => (
                <article
                  key={order._id}
                  className="rounded-xl border bg-gray-50 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString(dateLocale)}
                    </p>
                    <Badge variant="outline">
                      {labelOrderStatus(order.status, locale)}
                    </Badge>
                  </div>

                  <ul className="mb-3 space-y-1 border-t border-gray-200 pt-3 text-sm">
                    {order.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between gap-2"
                      >
                        <span>
                          {item.quantity}× {item.title}
                        </span>
                        <span className="text-gray-600">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mb-3 flex justify-between font-semibold">
                    <span>{t.common.total}</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPrintOrder(order)}
                    className="w-full border-slate-400 text-slate-700"
                  >
                    <Receipt className="mr-1 h-4 w-4" aria-hidden />
                    {k.printBill}
                  </Button>
                </article>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t.common.close}
            </Button>
            <Button
              type="button"
              disabled={!canClose || closing}
              onClick={onCloseTable}
              className={cn(
                "flex-1 bg-purple-600 text-white hover:bg-purple-700",
                !canClose && "opacity-50"
              )}
            >
              {closing ? t.common.loading : tbl.closeTable}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TableDetailModal
