"use client"

import { useAppDispatch, useAppSelector } from "@/hook/redux"
import {
  clearCheckout,
  setTableName,
  syncCartToCheckOut,
} from "@/store/reducer/checkout"
import React from "react"
import CheckOutItem from "./CheckOutItem"
import TabletCheckoutLayout from "./TabletCheckoutLayout"
import { POST_PLACE_ORDER } from "@/utils/APIConstant"
import { CONSUMER_MENU } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi, postApi } from "@/utils/common"
import toast from "react-hot-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { parseTableFromSearchParam } from "@/utils/table"
import { bumpSessionOrderNumber } from "@/utils/tabletSession"
import FullscreenButton from "@/components/MenuInterface/FullscreenButton"
import { PaperMenuShell } from "@/components/MenuInterface/tablet/PaperMenuShell"
import { useLocale } from "@/context/LocaleContext"
import { mapCheckoutItemToOrderPayload } from "@/utils/orderLineMapping"

type ConsumerMenuPayload = {
  menu: unknown[]
  restaurantName: string
}

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
  const { t } = useLocale()
  const [restaurantName, setRestaurantName] = React.useState("")

  React.useEffect(() => {
    const fromUrl = parseTableFromSearchParam(searchParams.get("table"))
    dispatch(setTableName(fromUrl ?? initialTableName))
  }, [searchParams, initialTableName, dispatch])

  React.useEffect(() => {
    const loadRestaurant = async () => {
      const res = await getApi<ApiResponse<ConsumerMenuPayload | unknown[]>>({
        url: CONSUMER_MENU + `?merchantId=${merchantId}`,
      })
      if (res?.success && res.data && !Array.isArray(res.data)) {
        setRestaurantName(res.data.restaurantName ?? t.common.restaurant)
      }
    }
    loadRestaurant()
  }, [merchantId])

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
        items: checkout.map(mapCheckoutItemToOrderPayload),
        total,
      },
    })

    setSubmitting(false)

    if (!res?.success) {
      toast.error(res?.message || t.tablet.couldNotPlaceOrder)
      return
    }

    bumpSessionOrderNumber(merchantId)
    dispatch(clearCheckout())
    toast.success(`${t.tablet.orderSent} — ${tableName}`)
    router.push(
      `/consumer/${merchantId}?table=${encodeURIComponent(tableName)}`
    )
  }

  React.useEffect(() => {
    dispatch(syncCartToCheckOut({ dispatch: dispatch }))
  }, [])

  const tableQuery = `?table=${encodeURIComponent(tableName)}`

  if (checkout.length === 0) {
    return (
      <PaperMenuShell className="flex flex-col items-center justify-center px-6 pb-28">
        <FullscreenButton className="!top-4 !right-3 !border-[#c9a227]/40 !bg-[#1c1916]/95 !text-[#e8d4a8]" />
        <p className="text-center text-[#8a7344]">{t.tablet.emptyCart}</p>
        <button
          type="button"
          onClick={() => router.push(`/consumer/${merchantId}${tableQuery}`)}
          className="mt-6 min-h-12 rounded-2xl border border-[#c9a227] bg-gradient-to-b from-[#c9a227] to-[#8a7344] px-8 text-sm font-bold text-[#121110] touch-manipulation"
        >
          {t.tablet.backToMenu}
        </button>
      </PaperMenuShell>
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
    <TabletCheckoutLayout
      merchantId={merchantId}
      restaurantName={restaurantName || t.common.restaurant}
      tableName={tableName}
      discountedTotal={discountedTotal}
      originalTotal={originalTotal}
      savings={savings}
      submitting={submitting}
      onPlaceOrder={handlePlaceOrder}
    >
      {checkout.map((item) => (
        <CheckOutItem key={String(item._id)} item={item} paper />
      ))}
    </TabletCheckoutLayout>
  )
}

export default CheckoutPage
