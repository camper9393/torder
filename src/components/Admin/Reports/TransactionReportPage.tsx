"use client"

import React from "react"
import { GET_ADMIN_REPORTS_TRANSACTIONS } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import type { TransactionReportData } from "@/types/reports"
import type { ReportDatePreset } from "@/utils/reports/dateRange"
import { formatPrice } from "@/utils/currency"
import { downloadCsv, printReportArea } from "@/utils/reports/export"
import { PAYMENT_METHOD_GROUPS, PAYMENT_METHOD_LABELS } from "@/utils/reports/paymentMethod"
import {
  ReportChartCard,
  ReportDataTable,
  ReportDateFilter,
  ReportEmpty,
  ReportError,
  ReportExportActions,
  ReportLineChart,
  ReportLoading,
  ReportMetricCard,
  ReportPageHeader,
  ReportPagination,
  ReportPieChart,
  useReportRangeGate,
} from "./ReportUi"

export default function TransactionReportPage() {
  const [preset, setPreset] = React.useState<ReportDatePreset>("last7")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [method, setMethod] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [data, setData] = React.useState<TransactionReportData | null>(null)
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
    if (method !== "all") param.method = method

    const res = await getApi<ApiResponse<TransactionReportData>>({
      url: GET_ADMIN_REPORTS_TRANSACTIONS,
      param,
    })

    if (res?.success && res.data) setData(res.data)
    else {
      setError(res?.message || "Тайлан ачаалж чадсангүй")
      setData(null)
    }
    setLoading(false)
  }, [preset, from, to, method, page])

  React.useEffect(() => {
    if (!rangeReady) return
    fetchReport()
  }, [fetchReport, rangeReady, page, method])

  const handleCsv = () => {
    if (!data) return
    downloadCsv(
      `guilgee-${data.range.from.slice(0, 10)}.csv`,
      [
        "Огноо",
        "Төлбөрийн хэлбэр",
        "Гүйлгээний тоо",
        "Нийт дүн",
        "Буцаалт",
        "Цэвэр дүн",
      ],
      data.rows.map((row) => [
        row.date,
        row.paymentMethod,
        row.transactionCount,
        row.grossAmount,
        row.refundAmount,
        row.netAmount,
      ])
    )
  }

  return (
    <div>
      <ReportPageHeader
        title="Гүйлгээний тайлан"
        subtitle="Төлбөрийн хэлбэрээр борлуулалтын гүйлгээ"
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
          value={method}
          onChange={(e) => {
            setMethod(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">Бүх төлбөр</option>
          {PAYMENT_METHOD_GROUPS.map((key) => (
            <option key={key} value={key}>
              {PAYMENT_METHOD_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {data && (
        <ReportExportActions
          onCsv={handleCsv}
          onPrint={() => printReportArea("transaction-report-print")}
        />
      )}

      {loading && <ReportLoading />}
      {!loading && error && (
        <ReportError message={error} onRetry={fetchReport} />
      )}
      {!loading && !error && data && (
        <div id="transaction-report-print">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <ReportMetricCard
              title="Нийт гүйлгээ"
              value={formatPrice(data.metrics.totalAmount)}
            />
            <ReportMetricCard
              title="Гүйлгээний тоо"
              value={String(data.metrics.totalCount)}
            />
            <ReportMetricCard
              title="Их ашигласан"
              value={data.metrics.mostUsedMethod ?? "—"}
            />
            <ReportMetricCard
              title="Буцаалт"
              value={formatPrice(data.metrics.refundAmount)}
              accent="text-red-600"
            />
            <ReportMetricCard
              title="Цэвэр дүн"
              value={formatPrice(data.metrics.netAmount)}
              accent="text-emerald-700"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportChartCard title="Төлбөрийн хуваарилалт">
              <ReportPieChart
                data={data.byMethod.map((row) => ({
                  name: row.method,
                  value: row.gross,
                }))}
              />
            </ReportChartCard>
            <ReportChartCard title="Өдрийн гүйлгээ">
              <ReportLineChart data={data.dailyTrend} />
            </ReportChartCard>
          </div>

          <h3 className="mb-3 font-semibold text-gray-900">Гүйлгээний жагсаалт</h3>
          <ReportDataTable
            columns={[
              { key: "date", label: "Огноо" },
              { key: "paymentMethod", label: "Төлбөр" },
              { key: "transactionCount", label: "Тоо", align: "right" },
              { key: "grossAmount", label: "Нийт", align: "right" },
              { key: "refundAmount", label: "Буцаалт", align: "right" },
              { key: "netAmount", label: "Цэвэр", align: "right" },
            ]}
            rows={
              data.rows.length
                ? data.rows.map((row) => ({
                    date: row.date,
                    paymentMethod: row.paymentMethod,
                    transactionCount: row.transactionCount,
                    grossAmount: formatPrice(row.grossAmount),
                    refundAmount: formatPrice(row.refundAmount),
                    netAmount: formatPrice(row.netAmount),
                  }))
                : []
            }
          />
          {!data.rows.length && <ReportEmpty />}
          <ReportPagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
