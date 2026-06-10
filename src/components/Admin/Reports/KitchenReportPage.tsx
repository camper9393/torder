"use client"

import React from "react"
import { GET_ADMIN_REPORTS_KITCHEN } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import type { KitchenReportData } from "@/types/reports"
import type { ReportDatePreset } from "@/utils/reports/dateRange"
import {
  ReportBarChart,
  ReportChartCard,
  ReportDataTable,
  ReportDateFilter,
  ReportEmpty,
  ReportError,
  ReportInfoBanner,
  ReportLineChart,
  ReportLoading,
  ReportMetricCard,
  ReportPageHeader,
  ReportPagination,
  useReportRangeGate,
} from "./ReportUi"

function formatMinutes(value: number | null) {
  if (value === null) return "—"
  return `${value} мин`
}

export default function KitchenReportPage() {
  const [preset, setPreset] = React.useState<ReportDatePreset>("last7")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [data, setData] = React.useState<KitchenReportData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const { rangeReady, applyCustomRange } = useReportRangeGate(preset)

  const fetchReport = React.useCallback(async () => {
    setLoading(true)
    setError("")
    const param: Record<string, string | number> = { preset, page, limit: 20 }
    if (preset === "custom") {
      if (from) param.from = from
      if (to) param.to = to
    }

    const res = await getApi<ApiResponse<KitchenReportData>>({
      url: GET_ADMIN_REPORTS_KITCHEN,
      param,
    })

    if (res?.success && res.data) setData(res.data)
    else {
      setError(res?.message || "Тайлан ачаалж чадсангүй")
      setData(null)
    }
    setLoading(false)
  }, [preset, from, to, page])

  React.useEffect(() => {
    if (!rangeReady) return
    fetchReport()
  }, [fetchReport, rangeReady, page])

  return (
    <div>
      <ReportPageHeader
        title="Гал тогооны тайлан"
        subtitle="Гал тогооны ачаалал, бэлтгэлийн хугацааны үзүүлэлт"
      />

      <ReportDateFilter
        preset={preset}
        from={from}
        to={to}
        onPresetChange={(p) => {
          setPage(1)
          setPreset(p)
        }}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={() => {
          const err = applyCustomRange(from, to, () => setPage(1))
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
          {!data.perItemPrepAvailable && (
            <ReportInfoBanner message="Бүтээгдэхүүн тус бүрийн бэлтгэлийн цагийн өгөгдөл байхгүй. Захиалгын түвшний цаг (createdAt → updatedAt) ашиглагдана." />
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <ReportMetricCard
              title="Дууссан захиалга"
              value={String(data.metrics.totalCookedOrders)}
            />
            <ReportMetricCard
              title="Бэлтгэсэн бараа"
              value={String(data.metrics.totalCookedItems)}
            />
            <ReportMetricCard
              title="Дундаж бэлтгэл"
              value={formatMinutes(data.metrics.averagePrepMinutes)}
            />
            <ReportMetricCard
              title="Хамгийн хурдан"
              value={formatMinutes(data.metrics.fastestOrderPrepMinutes)}
            />
            <ReportMetricCard
              title="Хамгийн удаан"
              value={formatMinutes(data.metrics.slowestOrderPrepMinutes)}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportChartCard title="Цагаар захиалга">
              <ReportBarChart
                data={data.ordersPerHour.map((row) => ({
                  label: row.label,
                  revenue: row.orders,
                }))}
                dataKey="revenue"
              />
            </ReportChartCard>
            <ReportChartCard title="Бэлтгэлийн чиг хандлага (мин)">
              <ReportLineChart
                data={data.prepTimeTrend.map((row) => ({
                  label: row.label,
                  revenue: row.minutes,
                }))}
              />
            </ReportChartCard>
            <ReportChartCard title="Топ бэлтгэсэн бараа">
              <ReportBarChart
                data={data.topCookedItems.map((row) => ({
                  label: row.label.slice(0, 18),
                  revenue: row.quantity,
                }))}
                dataKey="revenue"
              />
            </ReportChartCard>
            <ReportChartCard title="Цагийн ачаалал (барааны тоо)">
              <ReportBarChart data={data.hourlyWorkload} dataKey="revenue" />
            </ReportChartCard>
          </div>

          <h3 className="mb-3 font-semibold text-gray-900">
            Бүтээгдэхүүний бэлтгэлийн статистик
          </h3>
          <ReportDataTable
            columns={[
              { key: "productName", label: "Бүтээгдэхүүн" },
              { key: "quantityCooked", label: "Тоо", align: "right" },
              { key: "averagePrepMinutes", label: "Дундаж", align: "right" },
              { key: "fastestPrepMinutes", label: "Хурдан", align: "right" },
              { key: "slowestPrepMinutes", label: "Удаан", align: "right" },
            ]}
            rows={
              data.productStats.length
                ? data.productStats.map((row) => ({
                    productName: row.productName,
                    quantityCooked: row.quantityCooked,
                    averagePrepMinutes: formatMinutes(row.averagePrepMinutes),
                    fastestPrepMinutes: formatMinutes(row.fastestPrepMinutes),
                    slowestPrepMinutes: formatMinutes(row.slowestPrepMinutes),
                  }))
                : []
            }
          />
          {!data.productStats.length && <ReportEmpty />}
          <ReportPagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
