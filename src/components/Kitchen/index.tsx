"use client"

import React from "react"
import {
  CONSUMER_MENU,
  GET_KITCHEN_ORDERS,
  GET_WAITER_CALL,
  PATCH_KITCHEN_ORDER,
} from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi, patchApi } from "@/utils/common"
import toast from "react-hot-toast"
import { OrderStatus } from "@/model/order"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Volume2, VolumeX } from "lucide-react"
import Link from "next/link"
import { History, Monitor, Receipt } from "lucide-react"
import { KitchenOrder } from "@/types/kitchenOrder"
import { WaiterCallRecord } from "@/types/waiterCall"
import WaiterCallAlerts from "./WaiterCallAlerts"
import BillReceiptModal from "./BillReceiptModal"
import { useKitchenDing, useNotifyNewKitchenItems } from "@/hooks/useKitchenDing"
import { usePolling } from "@/hooks/usePolling"
import { labelOrderStatus } from "@/utils/i18n/orderStatus"
import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import { formatOrderItemLine } from "@/utils/menuBilingual"

const statusColor: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  cooking: "bg-orange-100 text-orange-800",
  done: "bg-green-100 text-green-800",
  closed: "bg-slate-100 text-slate-700",
}

type ConsumerMenuPayload = {
  menu: unknown[]
  restaurantName: string
}

function KitchenPage() {
  const [orders, setOrders] = React.useState<KitchenOrder[]>([])
  const [waiterCalls, setWaiterCalls] = React.useState<WaiterCallRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const { t, locale, dateLocale } = useLocale()
  const [restaurantName, setRestaurantName] = React.useState("")
  const [printOrder, setPrintOrder] = React.useState<KitchenOrder | null>(null)
  const k = t.kitchen
  const c = t.common

  const { soundEnabled, playDing, playWaiterDing, enableSound } = useKitchenDing()

  useNotifyNewKitchenItems(orders, "new", playDing)
  useNotifyNewKitchenItems(waiterCalls, "new", playWaiterDing)

  const fetchInFlightRef = React.useRef(false)
  const hasLoadedRef = React.useRef(false)

  const fetchKitchen = React.useCallback(async (options?: { silent?: boolean }) => {
    if (fetchInFlightRef.current) return
    fetchInFlightRef.current = true

    if (!options?.silent && !hasLoadedRef.current) {
      setLoading(true)
    }

    try {
      const [ordersRes, callsRes] = await Promise.all([
        getApi<ApiResponse<KitchenOrder[]>>({ url: GET_KITCHEN_ORDERS }),
        getApi<ApiResponse<WaiterCallRecord[]>>({ url: GET_WAITER_CALL }),
      ])

      if (ordersRes?.success && ordersRes.data) {
        setOrders(ordersRes.data)
      }
      if (callsRes?.success && callsRes.data) {
        setWaiterCalls(callsRes.data)
      }
      hasLoadedRef.current = true
    } finally {
      fetchInFlightRef.current = false
      setLoading(false)
    }
  }, [])

  usePolling(
    () => {
      void fetchKitchen({ silent: hasLoadedRef.current })
    },
    5000,
    true
  )

  React.useEffect(() => {
    const merchantId = orders.find((o) => o.merchantId)?.merchantId
    if (!merchantId) return

    const loadRestaurant = async () => {
      const res = await getApi<ApiResponse<ConsumerMenuPayload | unknown[]>>({
        url: `${CONSUMER_MENU}?merchantId=${merchantId}`,
      })
      if (res?.success && res.data && !Array.isArray(res.data)) {
        setRestaurantName(res.data.restaurantName ?? t.common.restaurant)
      }
    }

    loadRestaurant()
  }, [orders])

  const handleEnableSound = async () => {
    const ok = await enableSound()
    if (!ok) toast.error(k.couldNotEnableSound)
  }

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const res = await patchApi<ApiResponse<KitchenOrder>>({
      url: PATCH_KITCHEN_ORDER,
      values: { orderId, status },
    })

    if (!res?.success) {
      toast.error(res?.message || k.couldNotUpdateOrder)
      return
    }

    toast.success(k.orderMarked(labelOrderStatus(status, locale)))
    fetchKitchen()
  }

  return (
    <>
      <BillReceiptModal
        open={printOrder !== null}
        onClose={() => setPrintOrder(null)}
        order={printOrder}
        restaurantName={restaurantName || t.common.restaurant}
      />

      <div className="min-h-screen bg-[#F8F5F0]">
        <div className="mx-auto max-w-4xl">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="font-serif text-3xl font-bold text-slate-950">
                {k.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-white"
            >
              <Link href="/kitchen-tv">
                <Monitor className="mr-1 h-4 w-4" aria-hidden />
                {t.kitchenTv.title}
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-white"
            >
              <Link href="/admin/reports/order-history">
                <History className="mr-1 h-4 w-4" aria-hidden />
                {k.history}
              </Link>
            </Button>

              <span
                className="flex items-center gap-1.5 text-sm text-gray-600"
                title={soundEnabled ? k.soundOn : k.soundOff}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-green-600" aria-hidden />
                ) : (
                  <VolumeX className="h-4 w-4 text-gray-400" aria-hidden />
                )}
                <span className="sr-only">
                  {soundEnabled ? k.soundOn : k.soundOff}
                </span>
              </span>

              {!soundEnabled && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleEnableSound}
                  className="border-green-600 text-green-700 hover:bg-green-50"
                >
                  {k.enableSound}
                </Button>
              )}
            </div>
          </div>

          <p className="mb-8 text-sm text-gray-600">{k.refreshNote}</p>

          {loading && (
            <p className="text-center text-gray-500">{k.loading}</p>
          )}

          {!loading && (
            <>
              <WaiterCallAlerts calls={waiterCalls} onUpdated={fetchKitchen} />

              {orders.length === 0 && waiterCalls.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
                  {k.noActive}
                </div>
              )}

              {orders.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
                    {k.foodOrders}
                  </h2>
                  <div className="flex flex-col gap-4">
                    {orders.map((order) => (
                      <article
                        key={order._id}
                        className="rounded-2xl border bg-white p-5 shadow-sm"
                      >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                              {order.tableName}
                            </h2>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleString(dateLocale)}
                            </p>
                          </div>
                          <Badge className={statusColor[order.status]}>
                            {labelOrderStatus(order.status, locale)}
                          </Badge>
                        </div>

                        <ul className="mb-4 space-y-2 border-t pt-4">
                          {order.items.map((item, idx) => (
                            <li
                              key={`${order._id}-${idx}`}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {formatOrderItemLine(
                                  item,
                                  locale,
                                  item.quantity
                                )}
                              </span>
                              <span className="text-gray-600">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="mb-4 flex justify-between font-semibold text-gray-900">
                          <span>{c.total}</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={order.status !== "new"}
                              onClick={() => updateStatus(order._id, "accepted")}
                              className="border-blue-600 text-blue-700 hover:bg-blue-50"
                            >
                              {k.accept}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={order.status !== "accepted"}
                              onClick={() => updateStatus(order._id, "cooking")}
                              className="border-orange-600 text-orange-700 hover:bg-orange-50"
                            >
                              {k.cooking}
                            </Button>
                            <Button
                              size="sm"
                              disabled={order.status !== "cooking"}
                              onClick={() => updateStatus(order._id, "done")}
                              className="bg-green-600 text-white hover:bg-green-700"
                            >
                              {k.done}
                            </Button>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setPrintOrder(order)}
                            className="ml-auto shrink-0 border-slate-400 text-slate-700 hover:bg-slate-50"
                          >
                            <Receipt className="mr-1 h-4 w-4" aria-hidden />
                            {k.printBill}
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default KitchenPage
