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
import { formatPrice } from "@/utils/currency"
import { labelOrderStatus } from "@/utils/i18n/orderStatus"
import { useLocale } from "@/context/LocaleContext"
import { formatOrderItemLine } from "@/utils/menuBilingual"
import LanguageSwitcher from "@/components/common/LanguageSwitcher"
import SidebarMenuToggle from "@/components/layout/SidebarMenuToggle"

type HistoryFilter = "all" | "today"

function HistoryOrderCard({ order }: { order: KitchenOrder }) {
  const { t, locale, dateLocale } = useLocale()
  const completedAt = order.updatedAt ?? order.createdAt
  const c = t.common

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
    })

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {order.tableName}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {c.placed}: {formatDateTime(order.createdAt)}
          </p>
          <p className="text-xs text-gray-500">
            {c.completed}: {formatDateTime(completedAt)}
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800">
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
              {formatOrderItemLine(item, locale, item.quantity)}
            </span>
            <span className="text-gray-600">
              {formatPrice(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between font-semibold text-gray-900">
        <span>{c.total}</span>
        <span>{formatPrice(order.total)}</span>
      </div>
    </article>
  )
}

function HistoryPage() {
  const { t, locale } = useLocale()
  const [orders, setOrders] = React.useState<KitchenOrder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<HistoryFilter>("all")
  const h = t.history
  const c = t.common

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
    () => groupOrdersForHistory(filteredOrders, locale),
    [filteredOrders, locale]
  )

  const filterBtn = (active: boolean) =>
    cn(
      "min-h-10 rounded-full px-5 text-sm font-semibold touch-manipulation transition",
      active
        ? "bg-green-600 text-white shadow-sm"
        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
    )

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SidebarMenuToggle />
            <History className="h-8 w-8 text-green-600" aria-hidden />
            <h1 className="font-serif text-3xl font-bold text-slate-950">
              {h.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher />
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50"
            >
              <Link href="/kitchen">
                <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
                {t.kitchen.backToKitchen}
              </Link>
            </Button>
          </div>
        </div>

        <p className="mb-4 text-sm text-gray-600">{h.subtitle}</p>

        <div className="mb-8 flex gap-2">
          <button
            type="button"
            className={filterBtn(filter === "today")}
            onClick={() => setFilter("today")}
          >
            {c.today}
          </button>
          <button
            type="button"
            className={filterBtn(filter === "all")}
            onClick={() => setFilter("all")}
          >
            {c.all}
          </button>
        </div>

        {loading && (
          <p className="text-center text-gray-500">{h.loading}</p>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            {filter === "today" ? h.emptyToday : h.emptyAll}
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
