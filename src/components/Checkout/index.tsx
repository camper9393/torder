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
import { tabletCopy, TABLET_BG } from "@/components/MenuInterface/tablet/tabletUi"

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
  const [restaurantName, setRestaurantName] = React.useState("Restaurant")

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
        setRestaurantName(res.data.restaurantName ?? "Restaurant")
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
        items: checkout,
        total,
      },
    })

    setSubmitting(false)

    if (!res?.success) {
      toast.error(res?.message || "Could not place order")
      return
    }

    bumpSessionOrderNumber(merchantId)
    dispatch(clearCheckout())
    toast.success(`Order sent to kitchen — ${tableName}`)
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
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6 pb-28"
        style={{ backgroundColor: TABLET_BG }}
      >
        <FullscreenButton className="!top-4 !right-3" />
        <p className="text-center text-gray-600">{tabletCopy.en.emptyCart}</p>
        <button
          type="button"
          onClick={() => router.push(`/consumer/${merchantId}${tableQuery}`)}
          className="mt-6 min-h-12 rounded-2xl bg-[#1E5EFF] px-8 text-sm font-bold text-white touch-manipulation"
        >
          {tabletCopy.en.backToMenu}
        </button>
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
    <TabletCheckoutLayout
      merchantId={merchantId}
      restaurantName={restaurantName}
      tableName={tableName}
      itemCount={checkout.reduce((s, i) => s + i.itemCount, 0)}
      discountedTotal={discountedTotal}
      originalTotal={originalTotal}
      savings={savings}
      submitting={submitting}
      onPlaceOrder={handlePlaceOrder}
    >
      {checkout.map((item) => (
        <CheckOutItem key={String(item._id)} item={item} />
      ))}
    </TabletCheckoutLayout>
  )
}

export default CheckoutPage
