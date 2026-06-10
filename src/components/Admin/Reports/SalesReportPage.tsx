"use client"

import React from "react"
import { GET_ADMIN_REPORTS_SALES } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import type { SalesReportData } from "@/types/reports"
import type { ReportDatePreset } from "@/utils/reports/dateRange"
import { formatPrice } from "@/utils/currency"
import {
  ReportBarChart,
  ReportChartCard,
  ReportDataTable,
  ReportDateFilter,
  ReportEmpty,
  ReportError,
  ReportLineChart,
  ReportLoading,
  ReportMetricCard,
  ReportPageHeader,
  useReportRangeGate,
} from "./ReportUi"

export default function SalesReportPage() {
  const [preset, setPreset] = React.useState<ReportDatePreset>("last7")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [data, setData] = React.useState<SalesReportData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const { rangeReady, applyCustomRange } = useReportRangeGate(preset)

  const fetchReport = React.useCallback(async () => {
    setLoading(true)
    setError("")
    const param: Record<string, string> = { preset }
    if (preset === "custom") {
      if (from) param.from = from
      if (to) param.to = to
    }

    const res = await getApi<ApiResponse<SalesReportData>>({
      url: GET_ADMIN_REPORTS_SALES,
      param,
    })

    if (res?.success && res.data) {
      setData(res.data)
    } else {
      setError(res?.message || "Тайлан ачаалж чадсангүй")
      setData(null)
    }
    setLoading(false)
  }, [preset, from, to])

  React.useEffect(() => {
    if (!rangeReady) return
    fetchReport()
  }, [fetchReport, rangeReady])

  const metrics = data?.metrics

  return (
    <div>
      <ReportPageHeader
        title="Борлуулалтын тайлан"
        subtitle="Дууссан болон төлөгдсөн захиалгын борлуулалт"
      />

      <ReportDateFilter
        preset={preset}
        from={from}
        to={to}
        onPresetChange={setPreset}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={() => {
          const err = applyCustomRange(from, to)
          if (err) setError(err)
          else setError("")
        }}
      />

      {loading && <ReportLoading />}
      {!loading && error && (
        <ReportError message={error} onRetry={fetchReport} />
      )}
      {!loading && !error && data && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <ReportMetricCard
              title="Нийт борлуулалт"
              value={formatPrice(metrics?.totalSales ?? 0)}
            />
            <ReportMetricCard
              title="Захиалгын тоо"
              value={String(metrics?.totalOrders ?? 0)}
            />
            <ReportMetricCard
              title="Дундаж захиалга"
              value={formatPrice(metrics?.averageOrderValue ?? 0)}
            />
            <ReportMetricCard
              title="Буцаалт"
              value={formatPrice(metrics?.refundAmount ?? 0)}
              accent="text-red-600"
            />
            <ReportMetricCard
              title="Цэвэр орлого"
              value={formatPrice(metrics?.netRevenue ?? 0)}
              accent="text-emerald-700"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportChartCard title="Өдрийн борлуулалт" subtitle={data.range.label}>
              <ReportBarChart data={data.dailySales} />
            </ReportChartCard>
            <ReportChartCard title="Цагийн борлуулалт">
              <ReportBarChart data={data.hourlySales} />
            </ReportChartCard>
            <ReportChartCard title="7 хоногийн чиг хандлага">
              <ReportLineChart data={data.weeklyTrend} />
            </ReportChartCard>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">
                Өдрөөр борлуулалт
              </h3>
              <ReportDataTable
                columns={[
                  { key: "label", label: "Огноо" },
                  { key: "orders", label: "Захиалга", align: "right" },
                  { key: "revenue", label: "Дүн", align: "right" },
                ]}
                rows={data.salesByDate.map((row) => ({
                  label: row.label,
                  orders: row.orders,
                  revenue: formatPrice(row.revenue),
                }))}
              />
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">
                Ширээгээр борлуулалт
              </h3>
              <ReportDataTable
                columns={[
                  { key: "label", label: "Ширээ" },
                  { key: "orders", label: "Захиалга", align: "right" },
                  { key: "revenue", label: "Дүн", align: "right" },
                ]}
                rows={
                  data.salesByTable.length
                    ? data.salesByTable.map((row) => ({
                        label: row.label,
                        orders: row.orders,
                        revenue: formatPrice(row.revenue),
                      }))
                    : []
                }
              />
              {!data.salesByTable.length && <ReportEmpty />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
