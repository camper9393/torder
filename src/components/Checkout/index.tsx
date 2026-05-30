"use client"

import { useAppDispatch, useAppSelector } from "@/hook/redux"
import {
  clearCheckout,
  setTableName,
  syncCartToCheckOut,
} from "@/store/reducer/checkout"
import React from "react"
import CheckOutItem from "./CheckOutItem"
import { POST_PLACE_ORDER } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { postApi } from "@/utils/common"
import toast from "react-hot-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { parseTableFromSearchParam } from "@/utils/table"

function CheckoutPage({
  merchantId,
  initialTableName,
}: {
  merchantId: string
  initialTableName?: string
}) {
  const checkout = useAppSelector((state) => state.checkOut.items)
  const tableName = useAppSelector((state) => state.checkOut.tableName)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    const fromUrl = parseTableFromSearchParam(searchParams.get("table"))
    dispatch(setTableName(fromUrl ?? initialTableName))
  }, [searchParams, initialTableName, dispatch])

  const handlePlaceOrder = async () => {
    if (checkout.length === 0) return

    setSubmitting(true)

    const total = checkout.reduce(
      (sum, item) => sum + item.price * item.itemCount,
      0
    )

    const res = await postApi<ApiResponse<unknown>>({
      url: POST_PLACE_ORDER,
      values: {
        merchantId,
        tableName,
        items: checkout,
        total,
      },
    })

    setSubmitting(false)

    if (!res?.success) {
      toast.error(res?.message || "Could not place order")
      return
    }

    dispatch(clearCheckout())
    toast.success(`Order sent to kitchen — ${tableName}`)
    router.push(
      `/consumer/${merchantId}?table=${encodeURIComponent(tableName)}`
    )
  }

  React.useEffect(() => {
    dispatch(syncCartToCheckOut({ dispatch: dispatch }))
  }, [])

  if (checkout.length === 0) {
    return (
      <div className="px-6 pt-20 text-center text-gray-500">
        Your cart is empty
      </div>
    )
  }

  const originalTotal = checkout.reduce(
    (sum, item) =>
      sum + (item.originalPrice ?? item.price) * item.itemCount,
    0
  )

  const discountedTotal = checkout.reduce(
    (sum, item) => sum + item.price * item.itemCount,
    0
  )

  const savings = originalTotal - discountedTotal

  return (
    <div className="relative min-h-screen bg-gray-50 px-6 pt-20">
      <h1 className="mb-1 font-mono text-2xl text-zinc-950">Checkout</h1>
      <p className="mb-4 text-sm text-gray-500">Table: {tableName}</p>

      <div className="mb-32 flex flex-col gap-3">
        {checkout.map((item) => (
          <CheckOutItem key={String(item._id)} item={item} />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white px-6 py-4 shadow-lg">
        <div className="mb-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Item total</span>
            <span className="line-through">₹{originalTotal}</span>
          </div>

          <div className="flex justify-between font-medium text-green-600">
            <span>Just for you</span>
            <span>₹{discountedTotal}</span>
          </div>

          {savings > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>You saved</span>
              <span>₹{savings}</span>
            </div>
          )}
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={submitting}
          className="w-full cursor-pointer rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {submitting
            ? "Placing order..."
            : `Place Order • ₹${discountedTotal}`}
        </button>
      </div>
    </div>
  )
}

export default CheckoutPage
