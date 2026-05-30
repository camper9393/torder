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

type BillReceiptModalProps = {
  open: boolean
  onClose: () => void
  order: KitchenOrder | null
  restaurantName: string
}

function formatReceiptDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function BillReceiptModal({
  open,
  onClose,
  order,
  restaurantName,
}: BillReceiptModalProps) {
  const handlePrint = () => {
    window.print()
  }

  if (!order) return null

  const orderIdShort = String(order._id).slice(-8).toUpperCase()

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="kitchen-bill-dialog max-w-md print:max-w-none">
        <DialogTitle className="bill-receipt-actions sr-only">
          Bill receipt
        </DialogTitle>

        <div className="bill-receipt-actions mb-4 flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            <Printer className="mr-1 h-4 w-4" aria-hidden />
            Print
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div id="kitchen-bill-receipt" className="kitchen-bill-receipt">
          <div className="receipt-inner">
            <p className="receipt-title">{restaurantName}</p>
            <p className="receipt-sub">Tax Invoice / Bill</p>
            <div className="receipt-divider" />

            <p className="receipt-row">
              <span>Table</span>
              <span>{order.tableName}</span>
            </p>
            <p className="receipt-row">
              <span>Order ID</span>
              <span>#{orderIdShort}</span>
            </p>
            <p className="receipt-row">
              <span>Date</span>
              <span>{formatReceiptDate(order.createdAt)}</span>
            </p>
            <p className="receipt-row">
              <span>Status</span>
              <span className="capitalize">{order.status}</span>
            </p>

            <div className="receipt-divider" />
            <p className="receipt-items-head">Items</p>

            <ul className="receipt-items">
              {order.items.map((item, idx) => (
                <li key={idx} className="receipt-item">
                  <span className="receipt-item-name">
                    {item.quantity}× {item.title}
                  </span>
                  <span className="receipt-item-price">
                    ₹{item.price * item.quantity}
                  </span>
                </li>
              ))}
            </ul>

            <div className="receipt-divider" />
            <p className="receipt-total">
              <span>Total</span>
              <span>₹{order.total}</span>
            </p>

            <div className="receipt-divider" />
            <p className="receipt-footer">Thank you for dining with us!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BillReceiptModal
