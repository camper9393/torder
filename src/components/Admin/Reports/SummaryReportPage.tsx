"use client"

import React from "react"
import { GET_ADMIN_REPORTS_SUMMARY } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import type { SummaryReportData } from "@/types/reports"
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
  ReportPieChart,
  useReportRangeGate,
} from "./ReportUi"

function SummaryWidgetCard({
  widget,
}: {
  widget: SummaryReportData["widgets"]["bestProduct"]
}) {
  if (!widget) {
    return (
      <div className="rounded-2xl border border-dashed bg-white p-5 text-sm text-gray-500">
        Өгөгдөл байхгүй
      </div>
    )
  }
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{widget.title}</p>
      <p className="mt-2 text-lg font-bold text-gray-900">{widget.name}</p>
      <p className="mt-1 text-sm text-gray-600">
        {widget.quantity} ш · {formatPrice(widget.revenue)}
      </p>
    </div>
  )
}

export default function SummaryReportPage() {
  const [preset, setPreset] = React.useState<ReportDatePreset>("last7")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [data, setData] = React.useState<SummaryReportData | null>(null)
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

    const res = await getApi<ApiResponse<SummaryReportData>>({
      url: GET_ADMIN_REPORTS_SUMMARY,
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

  const m = data?.metrics

  return (
    <div>
      <ReportPageHeader
        title="Нэгдсэн тайлан"
        subtitle="Бизнесийн ерөнхий үзүүлэлт, чиг хандлага"
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
              value={formatPrice(m?.grossSales ?? 0)}
            />
            <ReportMetricCard
              title="Цэвэр борлуулалт"
              value={formatPrice(m?.netSales ?? 0)}
              accent="text-emerald-700"
            />
            <ReportMetricCard
              title="Буцаалт"
              value={formatPrice(m?.refunds ?? 0)}
              accent="text-red-600"
            />
            <ReportMetricCard
              title="Дундаж захиалга"
              value={formatPrice(m?.averageTicket ?? 0)}
            />
            <ReportMetricCard
              title="Ширээ эргэлт"
              value={String(m?.tableTurnoverRate ?? 0)}
              hint={`${m?.orderCount ?? 0} захиалга / ${m?.activeTables ?? 0} ширээ`}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryWidgetCard widget={data.widgets.bestProduct} />
            <SummaryWidgetCard widget={data.widgets.bestDrink} />
            <SummaryWidgetCard widget={data.widgets.mostActiveTable} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportChartCard title="Орлогын чиг хандлага">
              <ReportLineChart data={data.revenueTrend} />
            </ReportChartCard>
            <ReportChartCard title="Борлуулалтын хуваарилалт">
              <ReportPieChart data={data.salesDistribution} />
            </ReportChartCard>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 font-semibold text-gray-900">
              Тэргүүлэгч ангилал
            </h3>
            {data.topCategories.length ? (
              <>
                <ReportBarChart data={data.topCategories} />
                <div className="mt-4">
                  <ReportDataTable
                    columns={[
                      { key: "label", label: "Ангилал" },
                      { key: "orders", label: "Тоо", align: "right" },
                      { key: "revenue", label: "Дүн", align: "right" },
                    ]}
                    rows={data.topCategories.map((row) => ({
                      label: row.label,
                      orders: row.orders,
                      revenue: formatPrice(row.revenue),
                    }))}
                  />
                </div>
              </>
            ) : (
              <ReportEmpty />
            )}
          </div>
        </>
      )}
    </div>
  )
}
