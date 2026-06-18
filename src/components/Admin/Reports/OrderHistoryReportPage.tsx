"use client"

import React from "react"
import toast from "react-hot-toast"
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Printer,
  Receipt,
  RotateCcw,
} from "lucide-react"
import { GET_ADMIN_REPORTS_ORDER_HISTORY } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import type {
  OrderHistoryDetailData,
  OrderHistoryReportData,
  OrderHistoryRow,
} from "@/types/reports"
import type { ReportDatePreset } from "@/utils/reports/dateRange"
import { resolveReportDateRange } from "@/utils/reports/dateRange"
import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import RefundModal from "@/components/Refund/RefundModal"
import BillReceiptModal from "@/components/Kitchen/BillReceiptModal"
import { formatOrderItemLine } from "@/utils/menuBilingual"
import {
  ReportDateFilter,
  ReportEmpty,
  ReportError,
  ReportLoading,
  ReportMetricCard,
  ReportPageHeader,
  ReportPagination,
  useReportRangeGate,
} from "./ReportUi"
import {
  computeTodaySummary,
  formatReportDateTime,
  matchesPaymentFilter,
  PAYMENT_FILTER_OPTIONS,
  resolveOrderStatusBadge,
  resolvePaymentBadge,
  resolveVatTypeLabel,
} from "@/utils/reports/orderHistoryDisplay"
import {
  exportOrderHistoryCsv,
  exportOrderHistoryExcel,
  printOrderHistoryReport,
} from "@/utils/reports/orderHistoryExport"

function StatusBadge({
  status,
  refundStatus,
}: {
  status: OrderHistoryRow["status"]
  refundStatus?: string
}) {
  const badge = resolveOrderStatusBadge(status, refundStatus)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        badge.className
      )}
    >
      {badge.label}
    </span>
  )
}

function PaymentBadge({ method }: { method?: string }) {
  const badge = resolvePaymentBadge(method)
  return (
    <span
      className={cn(
        "inline-flex max-w-[120px] truncate items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        badge.className
      )}
      title={badge.label}
    >
      {badge.label}
    </span>
  )
}

function ExpandedOrderDetail({
  detail,
  locale,
  onPrint,
  onRefund,
  canRefund,
}: {
  detail: OrderHistoryDetailData
  locale: "mn" | "en" | "ko"
  onPrint: () => void
  onRefund: () => void
  canRefund: boolean
}) {
  const started = formatReportDateTime(detail.createdAt)
  const closed = formatReportDateTime(detail.paidAt ?? detail.updatedAt)

  return (
    <div className="space-y-4 border-t border-slate-100 bg-slate-50/80 px-4 py-4 md:px-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-3 text-sm">
          <p className="text-xs text-slate-500">Эхэлсэн цаг</p>
          <p className="font-medium text-slate-900">{started.full}</p>
        </div>
        <div className="rounded-xl border bg-white p-3 text-sm">
          <p className="text-xs text-slate-500">Хаагдсан цаг</p>
          <p className="font-medium text-slate-900">{closed.full}</p>
        </div>
        <div className="rounded-xl border bg-white p-3 text-sm">
          <p className="text-xs text-slate-500">Баримтын дугаар</p>
          <p className="font-mono font-medium text-slate-900">
            #{detail.orderNumber}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-3 text-sm">
          <p className="text-xs text-slate-500">Тэмдэглэл</p>
          <p className="text-slate-600">—</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs text-slate-600">
              <th className="px-4 py-2.5 font-semibold">Бараа</th>
              <th className="px-4 py-2.5 font-semibold text-right">Тоо</th>
              <th className="px-4 py-2.5 font-semibold text-right">Үнэ</th>
              <th className="px-4 py-2.5 font-semibold text-right">Дүн</th>
            </tr>
          </thead>
          <tbody>
            {detail.items.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="px-4 py-2.5">
                  {formatOrderItemLine(item, locale, item.quantity)}
                </td>
                <td className="px-4 py-2.5 text-right">{item.quantity}</td>
                <td className="px-4 py-2.5 text-right">
                  {formatPrice(item.price)}
                </td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {formatPrice(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          Нийт:{" "}
          <span className="font-semibold text-slate-900">
            {formatPrice(detail.netTotal)}
          </span>
          {(detail.refundedAmount ?? 0) > 0 ? (
            <span className="ml-2 text-red-600">
              (буцаалт: -{formatPrice(detail.refundedAmount ?? 0)})
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onPrint}>
            <Receipt className="mr-1.5 h-4 w-4" />
            Баримт
          </Button>
          {canRefund ? (
            <Button
              type="button"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={onRefund}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Буцаалт
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function OrderHistoryReportPage() {
  const { locale } = useLocale()
  const [preset, setPreset] = React.useState<ReportDatePreset>("last30")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [table, setTable] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [paymentFilter, setPaymentFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [data, setData] = React.useState<OrderHistoryReportData | null>(null)
  const [todaySummary, setTodaySummary] = React.useState({
    count: 0,
    revenue: 0,
    refundCount: 0,
    averageOrderValue: 0,
  })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [detailCache, setDetailCache] = React.useState<
    Record<string, OrderHistoryDetailData>
  >({})
  const [detailLoadingId, setDetailLoadingId] = React.useState<string | null>(
    null
  )
  const [refundOrderId, setRefundOrderId] = React.useState<string | null>(null)
  const [billOrder, setBillOrder] = React.useState<OrderHistoryDetailData | null>(
    null
  )
  const [exporting, setExporting] = React.useState(false)
  const { rangeReady, applyCustomRange } = useReportRangeGate(preset)

  const fetchList = React.useCallback(async () => {
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
    if (search.trim()) param.search = search.trim()
    if (table !== "all") param.table = table
    if (status !== "all") param.status = status

    const res = await getApi<ApiResponse<OrderHistoryReportData>>({
      url: GET_ADMIN_REPORTS_ORDER_HISTORY,
      param,
    })

    if (res?.success && res.data) {
      setData(res.data)
    } else {
      setError(res?.message || "Түүх ачаалж чадсангүй")
      setData(null)
    }
    setLoading(false)
  }, [preset, from, to, search, table, status, page])

  const fetchTodaySummary = React.useCallback(async () => {
    const res = await getApi<ApiResponse<OrderHistoryReportData>>({
      url: GET_ADMIN_REPORTS_ORDER_HISTORY,
      param: { preset: "today", page: 1, limit: 500 },
    })
    if (res?.success && res.data) {
      setTodaySummary(computeTodaySummary(res.data.orders))
    }
  }, [])

  React.useEffect(() => {
    if (!rangeReady) return
    fetchList()
  }, [fetchList, rangeReady])

  React.useEffect(() => {
    fetchTodaySummary()
  }, [fetchTodaySummary])

  const fetchOrderDetail = async (orderId: string) => {
    if (detailCache[orderId]) return detailCache[orderId]
    const res = await getApi<ApiResponse<{ detail: OrderHistoryDetailData }>>({
      url: GET_ADMIN_REPORTS_ORDER_HISTORY,
      param: { orderId },
    })
    const detail = res?.success ? res.data?.detail ?? null : null
    if (detail) {
      setDetailCache((prev) => ({ ...prev, [orderId]: detail }))
    }
    return detail
  }

  const toggleExpand = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null)
      return
    }
    setExpandedId(orderId)
    if (!detailCache[orderId]) {
      setDetailLoadingId(orderId)
      await fetchOrderDetail(orderId)
      setDetailLoadingId(null)
    }
  }

  const openBill = async (orderId: string) => {
    const row = await fetchOrderDetail(orderId)
    if (row) setBillOrder(row)
  }

  const canRefund = (row: OrderHistoryRow) =>
    (row.status === "done" || row.status === "closed") &&
    row.refundStatus !== "full"

  const visibleRows = React.useMemo(() => {
    if (!data?.orders) return []
    return data.orders.filter((row) =>
      matchesPaymentFilter(row.paymentMethod, paymentFilter)
    )
  }, [data?.orders, paymentFilter])

  const fetchAllForExport = async (): Promise<OrderHistoryRow[]> => {
    if (preset === "custom" && !rangeReady) {
      throw new Error("Захиалгат огноо сонгоод «Хэрэглэх» товч дарна уу")
    }

    const allRows: OrderHistoryRow[] = []
    let currentPage = 1
    let totalPages = 1

    do {
      const param: Record<string, string | number> = {
        preset,
        page: currentPage,
        limit: 500,
      }
      if (preset === "custom") {
        if (from) param.from = from
        if (to) param.to = to
      }
      if (search.trim()) param.search = search.trim()
      if (table !== "all") param.table = table
      if (status !== "all") param.status = status

      const res = await getApi<ApiResponse<OrderHistoryReportData>>({
        url: GET_ADMIN_REPORTS_ORDER_HISTORY,
        param,
      })

      if (!res?.success || !res.data) {
        throw new Error(res?.message || "Өгөгдөл татахад алдаа гарлаа")
      }

      allRows.push(...res.data.orders)
      totalPages = res.data.pagination.totalPages
      currentPage += 1
    } while (currentPage <= totalPages)

    return allRows.filter((row) =>
      matchesPaymentFilter(row.paymentMethod, paymentFilter)
    )
  }

  const getDateRangeLabel = () =>
    resolveReportDateRange(preset, from, to).label

  const runExport = async (
    action: (rows: OrderHistoryRow[]) => void | Promise<void>,
    emptyMessage: string,
    successMessage?: string
  ) => {
    setExporting(true)
    try {
      const rows = await fetchAllForExport()
      if (rows.length === 0) {
        toast.error(emptyMessage)
        return
      }
      await action(rows)
      if (successMessage) toast.success(successMessage)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Экспорт хийхэд алдаа гарлаа"
      toast.error(message)
      console.error("[order-history export]", err)
    } finally {
      setExporting(false)
    }
  }

  const handleExportCsv = () =>
    runExport(
      (rows) => exportOrderHistoryCsv(rows),
      "Экспортлох захиалга олдсонгүй",
      "CSV файл татагдлаа"
    )

  const handleExportExcel = () =>
    runExport(
      (rows) => exportOrderHistoryExcel(rows),
      "Экспортлох захиалга олдсонгүй",
      "Excel файл татагдлаа"
    )

  const handlePrint = () =>
    runExport(
      (rows) =>
        printOrderHistoryReport({
          title: "Захиалгын түүх",
          dateRangeLabel: getDateRangeLabel(),
          rows,
        }),
      "Хэвлэх захиалга олдсонгүй"
    )

  const filterSelectClass =
    "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm"

  return (
    <div className="pb-8">
      <ReportPageHeader
        title="Захиалгын түүх"
        subtitle="Рестораны захиалга, төлбөр, баримтын мэдээллийг нэг дор харах"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ReportMetricCard
          title="Өнөөдрийн захиалга"
          value={String(todaySummary.count)}
          accent="text-emerald-700"
          hint="Дууссан/хаагдсан"
        />
        <ReportMetricCard
          title="Өнөөдрийн орлого"
          value={formatPrice(todaySummary.revenue)}
          accent="text-blue-700"
        />
        <ReportMetricCard
          title="Дундаж захиалга"
          value={formatPrice(todaySummary.averageOrderValue)}
          accent="text-violet-700"
        />
        <ReportMetricCard
          title="Буцаалтын тоо"
          value={String(todaySummary.refundCount)}
          accent="text-red-700"
          hint="Өнөөдөр"
        />
      </div>

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

      <div className="mb-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Input
            placeholder="Захиалгын №, ширээ, бараа..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="xl:col-span-2"
          />
          <select
            className={filterSelectClass}
            value={table}
            onChange={(e) => {
              setTable(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">Бүх ширээ</option>
            {data?.tables.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            className={filterSelectClass}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            {PAYMENT_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className={filterSelectClass}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">Бүх төлөв</option>
            <option value="done">Бэлэн болсон</option>
            <option value="closed">Хаагдсан</option>
          </select>
          <select className={filterSelectClass} disabled title="Удахгүй">
            <option>Бүх ажилтан</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              setPage(1)
              fetchList()
            }}
          >
            Шүүх
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={exporting}
            onClick={handleExportCsv}
          >
            <Download className="mr-1.5 h-4 w-4" />
            CSV
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={exporting}
            onClick={handleExportExcel}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Excel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={exporting}
            onClick={handlePrint}
          >
            <Printer className="mr-1.5 h-4 w-4" />
            Хэвлэх
          </Button>
          {paymentFilter !== "all" ? (
            <Badge variant="outline" className="text-xs text-slate-600">
              Төлбөр: одоогийн хуудсан дээр шүүж байна
            </Badge>
          ) : null}
        </div>
      </div>

      {loading && <ReportLoading />}
      {!loading && error && (
        <ReportError message={error} onRetry={fetchList} />
      )}
      {!loading && !error && data && (
        <>
          {visibleRows.length === 0 ? (
            <ReportEmpty message="Захиалга олдсонгүй" />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1280px] text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <th className="w-8 px-3 py-3" />
                        <th className="px-3 py-3">Захиалгын №</th>
                        <th className="px-3 py-3">Ширээ</th>
                        <th className="px-3 py-3">Эхэлсэн</th>
                        <th className="px-3 py-3">Хаагдсан</th>
                        <th className="px-3 py-3 text-right">Бараа</th>
                        <th className="px-3 py-3 text-right">Нийт дүн</th>
                        <th className="px-3 py-3 text-right">Хөнгөлөлт</th>
                        <th className="px-3 py-3 text-right">Төлсөн</th>
                        <th className="px-3 py-3">Төлбөр</th>
                        <th className="px-3 py-3">Баримт</th>
                        <th className="px-3 py-3">Төлөв</th>
                        <th className="px-3 py-3">Ажилтан</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row) => {
                        const started = formatReportDateTime(row.createdAt)
                        const closed = formatReportDateTime(row.closedAt)
                        const isExpanded = expandedId === row._id
                        const detail = detailCache[row._id]

                        return (
                          <React.Fragment key={row._id}>
                            <tr
                              className={cn(
                                "cursor-pointer border-b transition-colors hover:bg-slate-50/80",
                                isExpanded && "bg-slate-50"
                              )}
                              onClick={() => toggleExpand(row._id)}
                            >
                              <td className="px-3 py-3 text-slate-400">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </td>
                              <td className="px-3 py-3 font-mono font-semibold text-slate-900">
                                #{row.orderNumber}
                              </td>
                              <td className="px-3 py-3 font-medium">
                                {row.tableName}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                                <div>{started.date}</div>
                                <div className="text-xs">{started.time}</div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                                <div>{closed.date}</div>
                                <div className="text-xs">{closed.time}</div>
                              </td>
                              <td className="px-3 py-3 text-right">
                                {row.itemsCount}
                              </td>
                              <td className="px-3 py-3 text-right font-medium">
                                {formatPrice(row.grossTotal)}
                              </td>
                              <td className="px-3 py-3 text-right text-amber-700">
                                {row.discountAmount > 0
                                  ? `-${formatPrice(row.discountAmount)}`
                                  : "—"}
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-emerald-700">
                                {formatPrice(row.paidAmount)}
                              </td>
                              <td className="px-3 py-3">
                                <PaymentBadge method={row.paymentMethod} />
                              </td>
                              <td className="px-3 py-3 text-slate-700">
                                {resolveVatTypeLabel(row.vatType)}
                              </td>
                              <td className="px-3 py-3">
                                <StatusBadge
                                  status={row.status}
                                  refundStatus={row.refundStatus}
                                />
                              </td>
                              <td className="px-3 py-3 text-slate-400">—</td>
                            </tr>
                            {isExpanded ? (
                              <tr>
                                <td colSpan={13} className="p-0">
                                  {detailLoadingId === row._id ? (
                                    <div className="border-t bg-slate-50 px-6 py-6 text-sm text-slate-500">
                                      Дэлгэрэнгүй ачааллаж байна...
                                    </div>
                                  ) : detail ? (
                                    <ExpandedOrderDetail
                                      detail={detail}
                                      locale={locale}
                                      canRefund={canRefund(row)}
                                      onPrint={() => openBill(row._id)}
                                      onRefund={() => setRefundOrderId(row._id)}
                                    />
                                  ) : (
                                    <div className="border-t bg-slate-50 px-6 py-6 text-sm text-red-600">
                                      Дэлгэрэнгүй ачаалж чадсангүй
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ) : null}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 lg:hidden">
                {visibleRows.map((row) => {
                  const started = formatReportDateTime(row.createdAt)
                  const closed = formatReportDateTime(row.closedAt)
                  const isExpanded = expandedId === row._id
                  const detail = detailCache[row._id]

                  return (
                    <article
                      key={row._id}
                      className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        className="w-full px-4 py-4 text-left"
                        onClick={() => toggleExpand(row._id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-mono text-base font-bold text-slate-900">
                              #{row.orderNumber}
                            </p>
                            <p className="mt-0.5 text-sm text-slate-600">
                              {row.tableName}
                            </p>
                          </div>
                          <StatusBadge
                            status={row.status}
                            refundStatus={row.refundStatus}
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400">Эхэлсэн: </span>
                            {started.full}
                          </div>
                          <div>
                            <span className="text-slate-400">Хаагдсан: </span>
                            {closed.full}
                          </div>
                          <div>
                            <span className="text-slate-400">Бараа: </span>
                            {row.itemsCount}
                          </div>
                          <div>
                            <span className="text-slate-400">Төлсөн: </span>
                            {formatPrice(row.paidAmount)}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <PaymentBadge method={row.paymentMethod} />
                          <span className="text-xs text-slate-500">
                            {resolveVatTypeLabel(row.vatType)}
                          </span>
                        </div>
                      </button>
                      {isExpanded ? (
                        detailLoadingId === row._id ? (
                          <div className="border-t px-4 py-4 text-sm text-slate-500">
                            Ачааллаж байна...
                          </div>
                        ) : detail ? (
                          <ExpandedOrderDetail
                            detail={detail}
                            locale={locale}
                            canRefund={canRefund(row)}
                            onPrint={() => openBill(row._id)}
                            onRefund={() => setRefundOrderId(row._id)}
                          />
                        ) : null
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </>
          )}
          <ReportPagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <RefundModal
        orderId={refundOrderId}
        open={Boolean(refundOrderId)}
        onOpenChange={(open) => !open && setRefundOrderId(null)}
        onSuccess={() => {
          fetchList()
          fetchTodaySummary()
        }}
      />

      <BillReceiptModal
        open={Boolean(billOrder)}
        onClose={() => setBillOrder(null)}
        order={billOrder}
        restaurantName="TOrder"
      />
    </div>
  )
}
