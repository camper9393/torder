"use client"

import { useEffect, useState } from "react"
import { BarChart3, TrendingDown, Banknote } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { GET_INVENTORY_REPORTS } from "@/utils/APIConstant"
import { getApi } from "@/utils/common"
import { ApiResponse } from "@/utils/api"
import type { InventoryReportsData } from "@/types/inventory"
import { formatPrice } from "@/utils/currency"
import { ChartResponsiveContainer } from "@/components/Dashboard/ChartResponsiveContainer"
import InventoryNav from "./InventoryNav"
import InventoryMetricCard from "./InventoryMetricCard"

export default function InventoryReportsPage() {
  const [data, setData] = useState<InventoryReportsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await getApi<ApiResponse<InventoryReportsData>>({
        url: GET_INVENTORY_REPORTS,
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
          Тайлан ачаалахад алдаа гарлаа
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] pb-10 dark:bg-slate-950">
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-green-600" aria-hidden />
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-950 dark:text-white">
            Агуулахын тайлан
          </h1>
          <p className="text-sm text-gray-600">Зарцуулалт болон үнэ цэнэ</p>
        </div>
      </div>

      <InventoryNav />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InventoryMetricCard
          title="Өнөөдрийн зарцуулалт"
          value={formatPrice(data.todayUsage)}
          icon={<TrendingDown className="h-5 w-5 text-orange-600" />}
          accent="bg-orange-50"
        />
        <InventoryMetricCard
          title="7 хоногийн зарцуулалт"
          value={formatPrice(data.weeklyUsage)}
          icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
          accent="bg-blue-50"
        />
        <InventoryMetricCard
          title="Агуулахын үнэ цэнэ"
          value={formatPrice(data.inventoryValue)}
          icon={<Banknote className="h-5 w-5 text-green-600" />}
          accent="bg-green-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-1 text-lg font-semibold">Өдрийн зарцуулалт</h2>
          <p className="mb-4 text-sm text-gray-500">Сүүлийн 7 хоног</p>
          <ChartResponsiveContainer>
            <LineChart data={data.dailyConsumption}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(v) => `${v}`} />
              <Tooltip
                formatter={(v) => formatPrice(Number(v ?? 0))}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartResponsiveContainer>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-1 text-lg font-semibold">Ангиллаар үнэ цэнэ</h2>
          <p className="mb-4 text-sm text-gray-500">Одоогийн үлдэгдэл</p>
          <ChartResponsiveContainer>
            <BarChart data={data.categoryConsumption}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(v) => `${v}`} />
              <Tooltip
                formatter={(v) => formatPrice(Number(v ?? 0))}
              />
              <Bar dataKey="cost" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold">Хамгийн их зарцуулсан орц</h2>
        {data.topUsedIngredients.length === 0 ? (
          <p className="text-sm text-gray-500">Өгөгдөл байхгүй</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Орц</th>
                  <th className="pb-2 pr-4">Хэмжээ</th>
                  <th className="pb-2">Өртөг</th>
                </tr>
              </thead>
              <tbody>
                {data.topUsedIngredients.map((row) => (
                  <tr key={row.name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{row.name}</td>
                    <td className="py-2 pr-4">
                      {row.quantity} {row.unit}
                    </td>
                    <td className="py-2">{formatPrice(row.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
