"use client"

import React from "react"
import { GET_KITCHEN_ORDERS, PATCH_KITCHEN_ORDER } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi, patchApi } from "@/utils/common"
import toast from "react-hot-toast"
import { OrderStatus } from "@/model/order"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

export type KitchenOrder = {
  _id: string
  tableName: string
  items: {
    title: string
    price: number
    quantity: number
    image?: string
  }[]
  total: number
  status: OrderStatus
  createdAt: string
}

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

function KitchenPage() {
  const [orders, setOrders] = React.useState<KitchenOrder[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchOrders = React.useCallback(async () => {
    const res = await getApi<ApiResponse<KitchenOrder[]>>({
      url: GET_KITCHEN_ORDERS,
    })

    if (res?.success && res.data) {
      setOrders(res.data)
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchOrders])

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
    fetchOrders()
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] px-4 py-24 md:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 font-serif text-3xl font-bold text-slate-950">
          Kitchen
        </h1>
        <p className="mb-8 text-sm text-gray-600">
          Active orders refresh every 5 seconds
        </p>

        {loading && (
          <p className="text-center text-gray-500">Loading orders...</p>
        )}

        {!loading && orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            No active orders right now
          </div>
        )}

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
      </div>
    </div>
  )
}

export default KitchenPage
