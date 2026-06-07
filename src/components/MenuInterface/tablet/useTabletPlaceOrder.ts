"use client"

import React from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { useAppDispatch, useAppSelector } from "@/hook/redux"
import { clearCheckout } from "@/store/reducer/checkout"
import { POST_PLACE_ORDER } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { postApi } from "@/utils/common"
import { appendTabletOrderHistory } from "@/utils/tabletOrderHistory"
import { bumpSessionOrderNumber } from "@/utils/tabletSession"
import { useLocale } from "@/context/LocaleContext"
import { mapCheckoutItemToOrderPayload } from "@/utils/orderLineMapping"

export function useTabletPlaceOrder(merchantId: string) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { t } = useLocale()
  const checkout = useAppSelector((state) => state.checkOut.items)
  const tableName = useAppSelector((state) => state.checkOut.tableName)
  const [submitting, setSubmitting] = React.useState(false)

  const discountedTotal = checkout.reduce(
    (sum, item) => sum + item.price * item.itemCount,
    0
  )

  const itemCount = checkout.reduce((sum, i) => sum + i.itemCount, 0)
  const isEmpty = checkout.length === 0

  const submitOrder = async (): Promise<boolean> => {
    if (isEmpty || submitting) return false

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
        items: checkout.map(mapCheckoutItemToOrderPayload),
        total,
      },
    })

    setSubmitting(false)

    if (!res?.success) {
      toast.error(res?.message || t.tablet.couldNotPlaceOrder)
      return false
    }

    appendTabletOrderHistory(merchantId, tableName, checkout)
    bumpSessionOrderNumber(merchantId)
    return true
  }

  const placeOrder = async () => {
    const ok = await submitOrder()
    if (!ok) return

    dispatch(clearCheckout())
    toast.success(`${t.tablet.orderSent} — ${tableName}`)
    router.push(
      `/consumer/${merchantId}?table=${encodeURIComponent(tableName)}`
    )
  }

  return {
    placeOrder,
    submitOrder,
    submitting,
    discountedTotal,
    itemCount,
    isEmpty,
  }
}
