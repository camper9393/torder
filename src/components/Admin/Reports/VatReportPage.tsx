"use client"

import React from "react"
import { GET_ADMIN_REPORTS_VAT } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import type { VatReportData } from "@/types/reports"
import type { ReportDatePreset } from "@/utils/reports/dateRange"
import { formatPrice } from "@/utils/currency"
import { downloadCsv, printReportArea } from "@/utils/reports/export"
import {
  ReportDataTable,
  ReportDateFilter,
  ReportEmpty,
  ReportError,
  ReportExportActions,
  ReportLoading,
  ReportMetricCard,
  ReportPageHeader,
  useReportRangeGate,
} from "./ReportUi"

export default function VatReportPage() {
  const [preset, setPreset] = React.useState<ReportDatePreset>("thisMonth")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [data, setData] = React.useState<VatReportData | null>(null)
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

    const res = await getApi<ApiResponse<VatReportData>>({
      url: GET_ADMIN_REPORTS_VAT,
      param,
    })

    if (res?.success && res.data) setData(res.data)
    else {
      setError(res?.message || "Тайлан ачаалж чадсангүй")
      setData(null)
    }
    setLoading(false)
  }, [preset, from, to])

  React.useEffect(() => {
    if (!rangeReady) return
    fetchReport()
  }, [fetchReport, rangeReady])

  const vatPercent = data ? Math.round(data.vatRate * 100) : 10

  const handleCsv = (type: "daily" | "monthly") => {
    if (!data) return
    const rows = type === "daily" ? data.daily : data.monthly
    downloadCsv(
      `noat-${type}-${data.range.from.slice(0, 10)}.csv`,
      [
        type === "daily" ? "Огноо" : "Сар",
        "Нийт борлуулалт",
        "Буцаалт",
        "Татварлах дүн",
        "НӨАТ",
        "Цэвэр НӨАТ",
      ],
      rows.map((row) => [
        row.period,
        row.grossSales,
        row.refundAmount,
        row.taxableSales,
        row.vatAmount,
        row.netVat,
      ])
    )
  }

  const tableRows = (rows: VatReportData["daily"]) =>
    rows.map((row) => ({
      period: row.period,
      grossSales: formatPrice(row.grossSales),
      refundAmount: formatPrice(row.refundAmount),
      taxableSales: formatPrice(row.taxableSales),
      vatAmount: formatPrice(row.vatAmount),
      netVat: formatPrice(row.netVat),
    }))

  return (
    <div>
      <ReportPageHeader
        title="НӨАТ"
        subtitle={`НӨАТ-ын хувь: ${vatPercent}% (үнэд багтсан гэж тооцно)`}
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

      {data && (
        <ReportExportActions
          onCsv={() => handleCsv("daily")}
          onPrint={() => printReportArea("vat-report-print")}
        />
      )}

      {loading && <ReportLoading />}
      {!loading && error && (
        <ReportError message={error} onRetry={fetchReport} />
      )}
      {!loading && !error && data && (
        <div id="vat-report-print">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <ReportMetricCard
              title="Нийт борлуулалт"
              value={formatPrice(data.metrics.grossSales)}
            />
            <ReportMetricCard
              title="Татварлах дүн"
              value={formatPrice(data.metrics.taxableSales)}
            />
            <ReportMetricCard
              title="НӨАТ"
              value={formatPrice(data.metrics.vatAmount)}
            />
            <ReportMetricCard
              title="Буцаалтын НӨАТ"
              value={formatPrice(data.metrics.refundVat)}
              accent="text-red-600"
            />
            <ReportMetricCard
              title="Цэвэр НӨАТ"
              value={formatPrice(data.metrics.netVat)}
              accent="text-emerald-700"
            />
          </div>

          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Өдрийн НӨАТ</h3>
              <button
                type="button"
                className="text-sm text-green-700 hover:underline print:hidden"
                onClick={() => handleCsv("daily")}
              >
                CSV татах
              </button>
            </div>
            {data.daily.length ? (
              <ReportDataTable
                columns={[
                  { key: "period", label: "Огноо" },
                  { key: "grossSales", label: "Нийт", align: "right" },
                  { key: "refundAmount", label: "Буцаалт", align: "right" },
                  { key: "taxableSales", label: "Татварлах", align: "right" },
                  { key: "vatAmount", label: "НӨАТ", align: "right" },
                  { key: "netVat", label: "Цэвэр НӨАТ", align: "right" },
                ]}
                rows={tableRows(data.daily)}
              />
            ) : (
              <ReportEmpty />
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Сарын НӨАТ</h3>
              <button
                type="button"
                className="text-sm text-green-700 hover:underline print:hidden"
                onClick={() => handleCsv("monthly")}
              >
                CSV татах
              </button>
            </div>
            {data.monthly.length ? (
              <ReportDataTable
                columns={[
                  { key: "period", label: "Сар" },
                  { key: "grossSales", label: "Нийт", align: "right" },
                  { key: "refundAmount", label: "Буцаалт", align: "right" },
                  { key: "taxableSales", label: "Татварлах", align: "right" },
                  { key: "vatAmount", label: "НӨАТ", align: "right" },
                  { key: "netVat", label: "Цэвэр НӨАТ", align: "right" },
                ]}
                rows={tableRows(data.monthly)}
              />
            ) : (
              <ReportEmpty />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
