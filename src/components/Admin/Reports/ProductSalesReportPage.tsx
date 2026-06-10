"use client"

import React from "react"
import { GET_ADMIN_REPORTS_PRODUCTS } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import type { ProductSalesReportData } from "@/types/reports"
import type { ReportDatePreset } from "@/utils/reports/dateRange"
import { formatPrice } from "@/utils/currency"
import { downloadCsv, printReportArea } from "@/utils/reports/export"
import {
  ReportBarChart,
  ReportChartCard,
  ReportDataTable,
  ReportDateFilter,
  ReportEmpty,
  ReportError,
  ReportExportActions,
  ReportLoading,
  ReportMetricCard,
  ReportPageHeader,
  ReportPagination,
  useReportRangeGate,
} from "./ReportUi"

export default function ProductSalesReportPage() {
  const [preset, setPreset] = React.useState<ReportDatePreset>("last7")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [category, setCategory] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [data, setData] = React.useState<ProductSalesReportData | null>(null)
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
    if (category !== "all") param.category = category

    const res = await getApi<ApiResponse<ProductSalesReportData>>({
      url: GET_ADMIN_REPORTS_PRODUCTS,
      param,
    })

    if (res?.success && res.data) setData(res.data)
    else {
      setError(res?.message || "Тайлан ачаалж чадсангүй")
      setData(null)
    }
    setLoading(false)
  }, [preset, from, to, category, page])

  React.useEffect(() => {
    if (!rangeReady) return
    fetchReport()
  }, [fetchReport, rangeReady, page, category])

  const handleCsv = () => {
    if (!data) return
    downloadCsv(
      `buteegehuun-borluulalt-${data.range.from.slice(0, 10)}.csv`,
      [
        "Бүтээгдэхүүн",
        "Ангилал",
        "Зарагдсан тоо",
        "Орлого",
        "Дундаж үнэ",
        "Буцаалтын тоо",
        "Цэвэр орлого",
      ],
      data.products.map((row) => [
        row.productName,
        row.category,
        row.quantitySold,
        row.revenue,
        row.averagePrice,
        row.refundQuantity,
        row.netRevenue,
      ])
    )
  }

  return (
    <div>
      <ReportPageHeader
        title="Бүтээгдэхүүний борлуулалт"
        subtitle="Бүтээгдэхүүн, ангиллаар борлуулалтын дэлгэрэнгүй"
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
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">Бүх ангилал</option>
          {data?.categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {data && (
        <ReportExportActions
          onCsv={handleCsv}
          onPrint={() => printReportArea("product-sales-print")}
        />
      )}

      {loading && <ReportLoading />}
      {!loading && error && (
        <ReportError message={error} onRetry={fetchReport} />
      )}
      {!loading && !error && data && (
        <div id="product-sales-print">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportMetricCard
              title="Нийт зарагдсан"
              value={String(data.metrics.totalProductsSold)}
            />
            <ReportMetricCard
              title="Бүтээгдэхүүний орлого"
              value={formatPrice(data.metrics.totalProductRevenue)}
            />
            <ReportMetricCard
              title="Шилдэг бүтээгдэхүүн"
              value={data.metrics.bestProduct ?? "—"}
            />
            <ReportMetricCard
              title="Шилдэг ангилал"
              value={data.metrics.bestCategory ?? "—"}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportChartCard title="Топ 10 — тоогоор">
              <ReportBarChart
                data={data.topByQuantity.map((row) => ({
                  label: row.label.slice(0, 18),
                  revenue: row.quantity,
                }))}
                dataKey="revenue"
              />
            </ReportChartCard>
            <ReportChartCard title="Топ 10 — орлогоор">
              <ReportBarChart data={data.topByRevenue} />
            </ReportChartCard>
            <ReportChartCard title="Ангиллын орлого">
              <ReportBarChart data={data.categoryRevenue} />
            </ReportChartCard>
          </div>

          <h3 className="mb-3 font-semibold text-gray-900">Бүтээгдэхүүний жагсаалт</h3>
          <ReportDataTable
            columns={[
              { key: "productName", label: "Бүтээгдэхүүн" },
              { key: "category", label: "Ангилал" },
              { key: "quantitySold", label: "Тоо", align: "right" },
              { key: "revenue", label: "Орлого", align: "right" },
              { key: "averagePrice", label: "Дундаж үнэ", align: "right" },
              { key: "refundQuantity", label: "Буцаалт", align: "right" },
              { key: "netRevenue", label: "Цэвэр", align: "right" },
            ]}
            rows={
              data.products.length
                ? data.products.map((row) => ({
                    productName: row.productName,
                    category: row.category,
                    quantitySold: row.quantitySold,
                    revenue: formatPrice(row.revenue),
                    averagePrice: formatPrice(row.averagePrice),
                    refundQuantity: row.refundQuantity,
                    netRevenue: formatPrice(row.netRevenue),
                  }))
                : []
            }
          />
          {!data.products.length && <ReportEmpty />}
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
