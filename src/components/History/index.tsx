"use client"

import React from "react"
import Link from "next/link"
import { GET_COMPLETED_ORDER_HISTORY } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import { KitchenOrder } from "@/types/kitchenOrder"
import {
  filterOrdersToday,
  groupOrdersForHistory,
} from "@/utils/groupOrdersByDate"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeft, History } from "lucide-react"

type HistoryFilter = "all" | "today"

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function HistoryOrderCard({ order }: { order: KitchenOrder }) {
  const completedAt = order.updatedAt ?? order.createdAt

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {order.tableName}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Placed: {formatDateTime(order.createdAt)}
          </p>
          <p className="text-xs text-gray-500">
            Completed: {formatDateTime(completedAt)}
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800 capitalize">
          {order.status}
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

      <div className="flex justify-between font-semibold text-gray-900">
        <span>Total</span>
        <span>₹{order.total}</span>
      </div>
    </article>
  )
}

function HistoryPage() {
  const [orders, setOrders] = React.useState<KitchenOrder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<HistoryFilter>("all")

  const fetchHistory = React.useCallback(async () => {
    const res = await getApi<ApiResponse<KitchenOrder[]>>({
      url: GET_COMPLETED_ORDER_HISTORY,
    })

    if (res?.success && res.data) {
      setOrders(res.data)
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const filteredOrders = React.useMemo(() => {
    if (filter === "today") return filterOrdersToday(orders)
    return orders
  }, [orders, filter])

  const sections = React.useMemo(
    () => groupOrdersForHistory(filteredOrders),
    [filteredOrders]
  )

  const filterBtn = (active: boolean) =>
    cn(
      "min-h-10 rounded-full px-5 text-sm font-semibold touch-manipulation transition",
      active
        ? "bg-green-600 text-white shadow-sm"
        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
    )

  return (
    <div className="min-h-screen bg-[#F8F5F0] px-4 py-24 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-green-600" aria-hidden />
            <h1 className="font-serif text-3xl font-bold text-slate-950">
              Order History
            </h1>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-50"
          >
            <Link href="/kitchen">
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
              Back to Kitchen
            </Link>
          </Button>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Completed orders only (status: done)
        </p>

        <div className="mb-8 flex gap-2">
          <button
            type="button"
            className={filterBtn(filter === "today")}
            onClick={() => setFilter("today")}
          >
            Today
          </button>
          <button
            type="button"
            className={filterBtn(filter === "all")}
            onClick={() => setFilter("all")}
          >
            All
          </button>
        </div>

        {loading && (
          <p className="text-center text-gray-500">Loading history...</p>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            {filter === "today"
              ? "No completed orders today"
              : "No completed orders yet"}
          </div>
        )}

        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.id}>
              <h2 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800">
                {section.label}
              </h2>

              <div className="flex flex-col gap-4">
                {section.orders.map((order) => (
                  <HistoryOrderCard key={order._id} order={order} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HistoryPage
