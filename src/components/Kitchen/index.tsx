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
import { History, Receipt } from "lucide-react"
import { KitchenOrder } from "@/types/kitchenOrder"
import { WaiterCallRecord } from "@/types/waiterCall"
import WaiterCallAlerts from "./WaiterCallAlerts"
import BillReceiptModal from "./BillReceiptModal"
import { useKitchenDing, useNotifyNewKitchenItems } from "@/hooks/useKitchenDing"

const statusLabel: Record<OrderStatus, string> = {
  new: "New",
  accepted: "Accepted",
  cooking: "Cooking",
  done: "Done",
}

const statusColor: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  cooking: "bg-orange-100 text-orange-800",
  done: "bg-green-100 text-green-800",
}

type ConsumerMenuPayload = {
  menu: unknown[]
  restaurantName: string
}

function KitchenPage() {
  const [orders, setOrders] = React.useState<KitchenOrder[]>([])
  const [waiterCalls, setWaiterCalls] = React.useState<WaiterCallRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [restaurantName, setRestaurantName] = React.useState("Restaurant")
  const [printOrder, setPrintOrder] = React.useState<KitchenOrder | null>(null)

  const { soundEnabled, playDing, enableSound } = useKitchenDing()

  useNotifyNewKitchenItems(orders, "new", playDing)
  useNotifyNewKitchenItems(waiterCalls, "new", playDing)

  const fetchKitchen = React.useCallback(async () => {
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
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchKitchen()
    const interval = setInterval(fetchKitchen, 5000)
    return () => clearInterval(interval)
  }, [fetchKitchen])

  React.useEffect(() => {
    const merchantId = orders.find((o) => o.merchantId)?.merchantId
    if (!merchantId) return

    const loadRestaurant = async () => {
      const res = await getApi<ApiResponse<ConsumerMenuPayload | unknown[]>>({
        url: `${CONSUMER_MENU}?merchantId=${merchantId}`,
      })
      if (res?.success && res.data && !Array.isArray(res.data)) {
        setRestaurantName(res.data.restaurantName ?? "Restaurant")
      }
    }

    loadRestaurant()
  }, [orders])

  const handleEnableSound = async () => {
    const ok = await enableSound()
    if (!ok) toast.error("Could not enable sound — try again")
  }

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const res = await patchApi<ApiResponse<KitchenOrder>>({
      url: PATCH_KITCHEN_ORDER,
      values: { orderId, status },
    })

    if (!res?.success) {
      toast.error(res?.message || "Could not update order")
      return
    }

    toast.success(`Order marked as ${statusLabel[status]}`)
    fetchKitchen()
  }

  return (
    <>
      <BillReceiptModal
        open={printOrder !== null}
        onClose={() => setPrintOrder(null)}
        order={printOrder}
        restaurantName={restaurantName}
      />

    <div className="min-h-screen bg-[#F8F5F0] px-4 py-24 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-serif text-3xl font-bold text-slate-950">
            Kitchen
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-white"
            >
              <Link href="/history">
                <History className="mr-1 h-4 w-4" aria-hidden />
                History
              </Link>
            </Button>

            <span
              className="flex items-center gap-1.5 text-sm text-gray-600"
              title={soundEnabled ? "Sound enabled" : "Sound off"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-green-600" aria-hidden />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" aria-hidden />
              )}
              <span className="sr-only">
                {soundEnabled ? "Sound enabled" : "Sound disabled"}
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
                Enable Sound
              </Button>
            )}
          </div>
        </div>

        <p className="mb-8 text-sm text-gray-600">
          Active orders and staff calls refresh every 5 seconds
        </p>

        {loading && (
          <p className="text-center text-gray-500">Loading kitchen...</p>
        )}

        {!loading && (
          <>
            <WaiterCallAlerts calls={waiterCalls} onUpdated={fetchKitchen} />

            {orders.length === 0 && waiterCalls.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
                No active orders or staff calls right now
              </div>
            )}

            {orders.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
                  Food orders
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
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={statusColor[order.status]}>
                          {statusLabel[order.status]}
                        </Badge>
                      </div>

                      <ul className="mb-4 space-y-2 border-t pt-4">
                        {order.items.map((item, idx) => (
                          <li
                            key={`${order._id}-${idx}`}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.quantity}× {item.title}
                            </span>
                            <span className="text-gray-600">
                              ₹{item.price * item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="mb-4 flex justify-between font-semibold text-gray-900">
                        <span>Total</span>
                        <span>₹{order.total}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setPrintOrder(order)}
                          className="border-slate-400 text-slate-700 hover:bg-slate-50"
                        >
                          <Receipt className="mr-1 h-4 w-4" aria-hidden />
                          Print Bill
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={order.status !== "new"}
                          onClick={() => updateStatus(order._id, "accepted")}
                          className="border-blue-600 text-blue-700 hover:bg-blue-50"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={order.status !== "accepted"}
                          onClick={() => updateStatus(order._id, "cooking")}
                          className="border-orange-600 text-orange-700 hover:bg-orange-50"
                        >
                          Cooking
                        </Button>
                        <Button
                          size="sm"
                          disabled={order.status !== "cooking"}
                          onClick={() => updateStatus(order._id, "done")}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          Done
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
