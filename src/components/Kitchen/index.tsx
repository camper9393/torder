"use client"

import React from "react"
import { GET_KITCHEN_ORDERS, PATCH_KITCHEN_ORDER } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi, patchApi } from "@/utils/common"
import toast from "react-hot-toast"
import { OrderStatus } from "@/model/order"
import { getKitchenDingSrc } from "@/utils/kitchenDing"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Volume2, VolumeX } from "lucide-react"

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
  const [soundEnabled, setSoundEnabled] = React.useState(false)

  const notifiedOrderIdsRef = React.useRef<Set<string>>(new Set())
  const initialLoadDoneRef = React.useRef(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const soundEnabledRef = React.useRef(false)

  React.useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  const getAudio = React.useCallback(() => {
    if (!audioRef.current) {
      const src = getKitchenDingSrc()
      if (!src) return null
      audioRef.current = new Audio(src)
      audioRef.current.volume = 0.6
    }
    return audioRef.current
  }, [])

  const playDing = React.useCallback(() => {
    if (!soundEnabledRef.current) return
    const audio = getAudio()
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => {
      // Autoplay may still be blocked until user gesture
    })
  }, [getAudio])

  const notifyNewOrders = React.useCallback(
    (fetchedOrders: KitchenOrder[]) => {
      const newStatusOrders = fetchedOrders.filter((o) => o.status === "new")

      if (!initialLoadDoneRef.current) {
        newStatusOrders.forEach((o) =>
          notifiedOrderIdsRef.current.add(o._id)
        )
        initialLoadDoneRef.current = true
        return
      }

      for (const order of newStatusOrders) {
        if (notifiedOrderIdsRef.current.has(order._id)) continue
        notifiedOrderIdsRef.current.add(order._id)
        playDing()
      }
    },
    [playDing]
  )

  const fetchOrders = React.useCallback(async () => {
    const res = await getApi<ApiResponse<KitchenOrder[]>>({
      url: GET_KITCHEN_ORDERS,
    })

    if (res?.success && res.data) {
      notifyNewOrders(res.data)
      setOrders(res.data)
    }
    setLoading(false)
  }, [notifyNewOrders])

  React.useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleEnableSound = async () => {
    const audio = getAudio()
    if (!audio) {
      toast.error("Could not initialize sound")
      return
    }

    try {
      audio.currentTime = 0
      await audio.play()
      setSoundEnabled(true)
      soundEnabledRef.current = true
    } catch {
      toast.error("Could not enable sound — try again")
    }
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
    fetchOrders()
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] px-4 py-24 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-serif text-3xl font-bold text-slate-950">
            Kitchen
          </h1>

          <div className="flex items-center gap-2">
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
