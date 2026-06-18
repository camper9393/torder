"use client"

import React from "react"
import { GET_KITCHEN_ORDERS, GET_WAITER_CALL } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import { OrderStatus } from "@/model/order"
import { KitchenOrder } from "@/types/kitchenOrder"
import { WaiterCallRecord } from "@/types/waiterCall"
import { useKitchenDing, useNotifyNewKitchenItems } from "@/hooks/useKitchenDing"
import { labelOrderStatus } from "@/utils/i18n/orderStatus"
import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import { formatOrderItemLine } from "@/utils/menuBilingual"
import { formatOrderNumber } from "@/utils/serializeKitchenOrder"
import LanguageSwitcher from "@/components/common/LanguageSwitcher"
import FullscreenButton from "@/components/MenuInterface/FullscreenButton"
import { cn } from "@/lib/utils"
import { Volume2, VolumeX, ChefHat } from "lucide-react"

const TV_ACTIVE_STATUSES = ["new", "accepted", "cooking"] as const satisfies readonly OrderStatus[]

const statusTvStyles: Record<
  (typeof TV_ACTIVE_STATUSES)[number],
  { card: string; badge: string; ring: string }
> = {
  new: {
    card: "bg-amber-950 border-amber-400",
    badge: "bg-amber-400 text-amber-950",
    ring: "ring-amber-400/60",
  },
  accepted: {
    card: "bg-blue-950 border-blue-400",
    badge: "bg-blue-400 text-blue-950",
    ring: "ring-blue-400/60",
  },
  cooking: {
    card: "bg-orange-950 border-orange-400",
    badge: "bg-orange-400 text-orange-950",
    ring: "ring-orange-400/60",
  },
}

function sortTvOrders(orders: KitchenOrder[]): KitchenOrder[] {
  const rank = (s: OrderStatus) => {
    const i = TV_ACTIVE_STATUSES.indexOf(s as (typeof TV_ACTIVE_STATUSES)[number])
    return i === -1 ? 99 : i
  }
  return [...orders].sort((a, b) => {
    const dr = rank(a.status) - rank(b.status)
    if (dr !== 0) return dr
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

function filterActiveOrders(orders: KitchenOrder[]): KitchenOrder[] {
  return orders.filter((o) =>
    TV_ACTIVE_STATUSES.includes(o.status as (typeof TV_ACTIVE_STATUSES)[number])
  )
}

function KitchenTv() {
  const [orders, setOrders] = React.useState<KitchenOrder[]>([])
  const [waiterCalls, setWaiterCalls] = React.useState<WaiterCallRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const { t, locale, dateLocale } = useLocale()
  const tv = t.kitchenTv
  const k = t.kitchen
  const c = t.common

  const { soundEnabled, playDing, playWaiterDing, enableSound } = useKitchenDing()

  useNotifyNewKitchenItems(orders, "new", playDing)
  useNotifyNewKitchenItems(waiterCalls, "new", playWaiterDing)

  const fetchData = React.useCallback(async () => {
    const [ordersRes, callsRes] = await Promise.all([
      getApi<ApiResponse<KitchenOrder[]>>({ url: GET_KITCHEN_ORDERS }),
      getApi<ApiResponse<WaiterCallRecord[]>>({ url: GET_WAITER_CALL }),
    ])

    if (ordersRes?.success && ordersRes.data) {
      setOrders(filterActiveOrders(ordersRes.data))
    }
    if (callsRes?.success && callsRes.data) {
      setWaiterCalls(callsRes.data)
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  const displayOrders = React.useMemo(() => sortTvOrders(orders), [orders])

  const activeWaiterCalls = waiterCalls.filter(
    (call) => call.status === "new" || call.status === "accepted"
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-slate-700 bg-slate-900/95 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ChefHat className="h-10 w-10 shrink-0 text-emerald-400" aria-hidden />
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
                {tv.title}
              </h1>
              <p className="text-sm text-slate-400 sm:text-base">{tv.refreshNote}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher className="border-slate-600 bg-slate-800 text-white [&_select]:text-white" />

            <button
              type="button"
              onClick={() => void enableSound()}
              className={cn(
                "flex min-h-12 items-center gap-2 rounded-xl border-2 px-4 text-base font-bold touch-manipulation",
                soundEnabled
                  ? "border-emerald-500 bg-emerald-950 text-emerald-300"
                  : "border-slate-500 bg-slate-800 text-slate-200 hover:border-emerald-500"
              )}
              title={soundEnabled ? k.soundOn : k.soundOff}
            >
              {soundEnabled ? (
                <Volume2 className="h-6 w-6" aria-hidden />
              ) : (
                <VolumeX className="h-6 w-6" aria-hidden />
              )}
              <span className="hidden sm:inline">
                {soundEnabled ? k.soundOn : k.enableSound}
              </span>
            </button>

            <FullscreenButton className="!static !top-auto !right-auto !min-h-12 !rounded-xl !border-2 !border-slate-500 !bg-slate-800 !px-5 !py-3 !text-base !font-bold !text-white !shadow-none hover:!bg-slate-700 [&_svg]:!text-emerald-400" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1920px] px-4 py-6 sm:px-6 sm:py-8">
        {activeWaiterCalls.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold uppercase tracking-wide text-rose-400 sm:text-2xl">
              {k.staffCalls}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeWaiterCalls.map((call) => (
                <div
                  key={call._id}
                  className="animate-pulse rounded-2xl border-4 border-rose-500 bg-rose-950 px-6 py-5 ring-4 ring-rose-500/40"
                >
                  <p className="text-2xl font-black text-rose-100 sm:text-3xl">
                    {k.callingStaff(call.tableName)}
                  </p>
                  <p className="mt-2 text-lg text-rose-200/80">
                    {new Date(call.createdAt).toLocaleString(dateLocale, {
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {loading && (
          <p className="py-24 text-center text-2xl font-semibold text-slate-400">
            {tv.loading}
          </p>
        )}

        {!loading && displayOrders.length === 0 && activeWaiterCalls.length === 0 && (
          <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border-4 border-dashed border-slate-700 bg-slate-900/50 p-12">
            <p className="text-center text-2xl font-semibold text-slate-400 sm:text-4xl">
              {tv.noActive}
            </p>
          </div>
        )}

        {!loading && displayOrders.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {displayOrders.map((order) => {
              const styles =
                statusTvStyles[
                  order.status as (typeof TV_ACTIVE_STATUSES)[number]
                ] ?? statusTvStyles.new

              return (
                <article
                  key={order._id}
                  className={cn(
                    "flex flex-col rounded-3xl border-4 p-6 shadow-2xl ring-4",
                    styles.card,
                    styles.ring
                  )}
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                      {order.tableName}
                    </h2>
                    <span
                      className={cn(
                        "rounded-xl px-4 py-2 text-lg font-black uppercase sm:text-xl",
                        styles.badge
                      )}
                    >
                      {labelOrderStatus(order.status, locale)}
                    </span>
                  </div>

                  <p className="mb-1 text-lg text-slate-300 sm:text-xl">
                    #{formatOrderNumber(order)}
                  </p>
                  <p className="mb-4 text-lg text-slate-300 sm:text-xl">
                    {tv.orderTime}:{" "}
                    <span className="font-semibold text-white">
                      {new Date(order.createdAt).toLocaleString(dateLocale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </p>

                  <ul className="mb-6 flex-1 space-y-3 border-t border-white/20 pt-4">
                    {order.items.map((item, idx) => (
                      <li
                        key={`${order._id}-${idx}`}
                        className="flex justify-between gap-4 text-xl font-semibold text-white sm:text-2xl"
                      >
                        <span>
                          <span className="text-amber-300">{item.quantity}×</span>{" "}
                          {formatOrderItemLine(item, locale, item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between border-t border-white/20 pt-4">
                    <span className="text-xl font-bold text-slate-300 sm:text-2xl">
                      {c.total}
                    </span>
                    <span className="text-3xl font-black text-white sm:text-4xl">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default KitchenTv
