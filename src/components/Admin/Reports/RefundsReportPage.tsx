"use client"

import React from "react"
import { GET_ADMIN_REPORTS_REFUNDS } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import type { RefundReportData } from "@/types/reports"
import type { ReportDatePreset } from "@/utils/reports/dateRange"
import { REFUND_REASON_LABELS } from "@/types/refund"
import type { RefundReason } from "@/model/refund"
import { formatPrice } from "@/utils/currency"
import {
  ReportBarChart,
  ReportChartCard,
  ReportDateFilter,
  ReportEmpty,
  ReportError,
  ReportLineChart,
  ReportLoading,
  ReportMetricCard,
  ReportPageHeader,
  ReportPagination,
  useReportRangeGate,
} from "./ReportUi"

export default function RefundsReportPage() {
  const [preset, setPreset] = React.useState<ReportDatePreset>("last30")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [reason, setReason] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [data, setData] = React.useState<RefundReportData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const { rangeReady, applyCustomRange } = useReportRangeGate(preset)

  const fetchReport = React.useCallback(async () => {
    setLoading(true)
    setError("")
    const param: Record<string, string | number> = {
      preset,
      page,
      limit: 20,
    }
    if (preset === "custom") {
      if (from) param.from = from
      if (to) param.to = to
    }
    if (reason !== "all") param.reason = reason

    const res = await getApi<ApiResponse<RefundReportData>>({
      url: GET_ADMIN_REPORTS_REFUNDS,
      param,
    })

    if (res?.success && res.data) {
      setData(res.data)
    } else {
      setError(res?.message || "Тайлан ачаалж чадсангүй")
      setData(null)
    }
    setLoading(false)
  }, [preset, from, to, reason, page])

  React.useEffect(() => {
    if (!rangeReady) return
    fetchReport()
  }, [fetchReport, rangeReady, page, reason])

  return (
    <div>
      <ReportPageHeader
        title="Буцаалт"
        subtitle="Буцаалтын дүн борлуулалтын тайланд хасагдана"
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

      <div className="mb-4">
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">Бүх шалтгаан</option>
          {(
            Object.entries(REFUND_REASON_LABELS) as [RefundReason, string][]
          ).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading && <ReportLoading />}
      {!loading && error && (
        <ReportError message={error} onRetry={fetchReport} />
      )}
      {!loading && !error && data && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReportMetricCard
              title="Буцаалтын тоо"
              value={String(data.metrics.refundCount)}
            />
            <ReportMetricCard
              title="Буцаалтын дүн"
              value={formatPrice(data.metrics.refundAmount)}
              accent="text-red-600"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportChartCard title="Буцаалтын чиг хандлага">
              <ReportLineChart
                data={data.trend.map((row) => ({
                  label: row.label,
                  revenue: row.revenue,
                }))}
              />
            </ReportChartCard>
            <ReportChartCard title="Шалтгаанаар">
              <ReportBarChart
                data={data.reasons.map((row) => ({
                  label: row.label,
                  revenue: row.amount,
                  orders: row.count,
                }))}
              />
            </ReportChartCard>
          </div>

          {data.refunds.length === 0 ? (
            <ReportEmpty message="Буцаалт олдсонгүй" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-3 font-semibold">Дугаар</th>
                    <th className="px-4 py-3 font-semibold">Ширээ</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Дүн
                    </th>
                    <th className="px-4 py-3 font-semibold">Шалтгаан</th>
                    <th className="px-4 py-3 font-semibold">Огноо</th>
                    <th className="px-4 py-3 font-semibold">Хэрэглэгч</th>
                  </tr>
                </thead>
                <tbody>
                  {data.refunds.map((row) => (
                    <tr
                      key={row._id}
                      className="border-b last:border-0 hover:bg-gray-50/80"
                    >
                      <td className="px-4 py-3 font-medium">
                        #{row.orderNumber}
                      </td>
                      <td className="px-4 py-3">{row.tableName}</td>
                      <td className="px-4 py-3 text-right text-red-600">
                        -{formatPrice(row.refundAmount)}
                      </td>
                      <td className="px-4 py-3">{row.reasonLabel}</td>
                      <td className="px-4 py-3">
                        {row.date} {row.time}
                      </td>
                      <td className="px-4 py-3">{row.userName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
