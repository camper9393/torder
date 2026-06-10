"use client"

import { useEffect, useState } from "react"
import {
  Package,
  AlertTriangle,
  XCircle,
  TrendingDown,
  Banknote,
} from "lucide-react"
import { GET_INVENTORY_DASHBOARD } from "@/utils/APIConstant"
import { getApi } from "@/utils/common"
import { ApiResponse } from "@/utils/api"
import type { InventoryDashboardData } from "@/types/inventory"
import { formatPrice } from "@/utils/currency"
import InventoryNav from "./InventoryNav"
import InventoryMetricCard from "./InventoryMetricCard"
import InventoryAlerts from "./InventoryAlerts"

export default function InventoryDashboard() {
  const [data, setData] = useState<InventoryDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await getApi<ApiResponse<InventoryDashboardData>>({
        url: GET_INVENTORY_DASHBOARD,
      })
      if (res?.success && res.data) setData(res.data)
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] pb-10 dark:bg-slate-950">
        <div className="py-16 text-center text-gray-500">Ачааллаж байна...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] pb-10 dark:bg-slate-950">
        <div className="py-16 text-center text-gray-500">
          Өгөгдөл ачаалахад алдаа гарлаа
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] pb-10 dark:bg-slate-950">
      <div className="mb-6 flex items-center gap-3">
        <Package className="h-8 w-8 text-green-600" aria-hidden />
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-950 dark:text-white md:text-3xl">
            Inventory
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Агуулахын удирдлага
          </p>
        </div>
      </div>

      <InventoryNav />

      {data.alerts.length > 0 && (
        <div className="mb-6">
          <InventoryAlerts alerts={data.alerts} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <InventoryMetricCard
          title="Нийт бараа"
          value={String(data.totalItems)}
          icon={<Package className="h-5 w-5 text-blue-600" />}
          accent="bg-blue-50"
        />
        <InventoryMetricCard
          title="Бага үлдэгдэл"
          value={String(data.lowStockItems)}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          accent="bg-amber-50"
        />
        <InventoryMetricCard
          title="Дууссан"
          value={String(data.outOfStockItems)}
          icon={<XCircle className="h-5 w-5 text-red-600" />}
          accent="bg-red-50"
        />
        <InventoryMetricCard
          title="Өнөөдрийн зарцуулалт"
          value={formatPrice(data.todayUsageCost)}
          icon={<TrendingDown className="h-5 w-5 text-orange-600" />}
          accent="bg-orange-50"
        />
        <InventoryMetricCard
          title="Нийт үнэ цэнэ"
          value={formatPrice(data.totalInventoryValue)}
          icon={<Banknote className="h-5 w-5 text-green-600" />}
          accent="bg-green-50"
        />
      </div>
    </div>
  )
}
