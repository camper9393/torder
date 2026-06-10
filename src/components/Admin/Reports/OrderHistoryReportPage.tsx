"use client"

import React from "react"
import { GET_ADMIN_REPORTS_ORDER_HISTORY } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import type {
  OrderHistoryDetailData,
  OrderHistoryReportData,
} from "@/types/reports"
import type { ReportDatePreset } from "@/utils/reports/dateRange"
import { formatPrice } from "@/utils/currency"
import { labelOrderStatus } from "@/utils/i18n/orderStatus"
import { useLocale } from "@/context/LocaleContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import RefundModal from "@/components/Refund/RefundModal"
import BillReceiptModal from "@/components/Kitchen/BillReceiptModal"
import { formatOrderItemLine } from "@/utils/menuBilingual"
import { REFUND_STATUS_LABELS } from "@/types/refund"
import type { RefundStatus } from "@/model/order"
import {
  ReportDateFilter,
  ReportEmpty,
  ReportError,
  ReportLoading,
  ReportPageHeader,
  ReportPagination,
  useReportRangeGate,
} from "./ReportUi"

export default function OrderHistoryReportPage() {
  const { locale } = useLocale()
  const [preset, setPreset] = React.useState<ReportDatePreset>("last30")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [table, setTable] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [data, setData] = React.useState<OrderHistoryReportData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [detail, setDetail] = React.useState<OrderHistoryDetailData | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [refundOrderId, setRefundOrderId] = React.useState<string | null>(null)
  const [billOrder, setBillOrder] = React.useState<OrderHistoryDetailData | null>(
    null
  )
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

  React.useEffect(() => {
    if (!rangeReady) return
    fetchList()
  }, [fetchList, rangeReady, page, table, status])

  const fetchOrderDetail = async (orderId: string) => {
    const res = await getApi<ApiResponse<{ detail: OrderHistoryDetailData }>>({
      url: GET_ADMIN_REPORTS_ORDER_HISTORY,
      param: { orderId },
    })
    return res?.success ? res.data?.detail ?? null : null
  }

  const openDetail = async (orderId: string) => {
    const row = await fetchOrderDetail(orderId)
    if (!row) {
      setError("Захиалга олдсонгүй")
      return
    }
    setDetail(row)
    setDetailOpen(true)
  }

  const openBill = async (orderId: string) => {
    const row = await fetchOrderDetail(orderId)
    if (row) setBillOrder(row)
  }

  const canRefund = (row: OrderHistoryReportData["orders"][0]) =>
    (row.status === "done" || row.status === "closed") &&
    row.refundStatus !== "full"

  return (
    <div>
      <ReportPageHeader
        title="Захиалгын түүх"
        subtitle="Дууссан захиалгуудын жагсаалт, дэлгэрэнгүй, баримт, буцаалт"
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

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Хайх (ширээ, бараа, дугаар)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="rounded-lg border px-3 py-2 text-sm"
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
          className="rounded-lg border px-3 py-2 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">Бүх төлөв</option>
          <option value="done">Дууссан</option>
          <option value="closed">Хаагдсан</option>
        </select>
        <Button
          type="button"
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          onClick={() => {
            setPage(1)
            fetchList()
          }}
        >
          Шүүх
        </Button>
      </div>

      {loading && <ReportLoading />}
      {!loading && error && (
        <ReportError message={error} onRetry={fetchList} />
      )}
      {!loading && !error && data && (
        <>
          {data.orders.length === 0 ? (
            <ReportEmpty message="Захиалга олдсонгүй" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-3 font-semibold">Дугаар</th>
                    <th className="px-4 py-3 font-semibold">Ширээ</th>
                    <th className="px-4 py-3 font-semibold">Огноо</th>
                    <th className="px-4 py-3 font-semibold">Цаг</th>
                    <th className="px-4 py-3 font-semibold text-right">Бараа</th>
                    <th className="px-4 py-3 font-semibold text-right">Дүн</th>
                    <th className="px-4 py-3 font-semibold">Төлөв</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Үйлдэл
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((row) => (
                    <tr
                      key={row._id}
                      className="border-b last:border-0 hover:bg-gray-50/80"
                    >
                      <td className="px-4 py-3 font-medium">
                        #{row.orderNumber}
                      </td>
                      <td className="px-4 py-3">{row.tableName}</td>
                      <td className="px-4 py-3">{row.date}</td>
                      <td className="px-4 py-3">{row.time}</td>
                      <td className="px-4 py-3 text-right">{row.itemsCount}</td>
                      <td className="px-4 py-3 text-right">
                        {formatPrice(row.netTotal)}
                      </td>
                      <td className="px-4 py-3">
                        {labelOrderStatus(row.status, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openDetail(row._id)}
                          >
                            Дэлгэрэнгүй
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openBill(row._id)}
                          >
                            Баримт
                          </Button>
                          {canRefund(row) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-amber-300 text-amber-800"
                              onClick={() => setRefundOrderId(row._id)}
                            >
                              Refund
                            </Button>
                          ) : null}
                        </div>
                      </td>
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Захиалга #{detail?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="space-y-4 text-sm">
              <p className="text-gray-600">
                {detail.tableName} ·{" "}
                {labelOrderStatus(detail.status, locale)}
              </p>
              {detail.refundStatus && detail.refundStatus !== "none" ? (
                <p className="text-amber-700">
                  {REFUND_STATUS_LABELS[detail.refundStatus as RefundStatus]}
                </p>
              ) : null}
              <ul className="space-y-2 border-t pt-3">
                {detail.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between gap-2">
                    <span>
                      {formatOrderItemLine(item, locale, item.quantity)}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 border-t pt-3">
                <div className="flex justify-between">
                  <span>НӨАТ</span>
                  <span>{formatPrice(detail.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Буцаалт</span>
                  <span className="text-red-600">
                    -{formatPrice(detail.refundedAmount ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Эцсийн дүн</span>
                  <span>{formatPrice(detail.netTotal)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setBillOrder(detail)}
                >
                  Баримт хэвлэх
                </Button>
                {canRefund({
                  _id: detail._id,
                  orderNumber: detail.orderNumber,
                  tableName: detail.tableName,
                  date: "",
                  time: "",
                  itemsCount: detail.itemsCount,
                  total: detail.total,
                  netTotal: detail.netTotal,
                  status: detail.status,
                  refundStatus: detail.refundStatus,
                }) ? (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => {
                      setDetailOpen(false)
                      setRefundOrderId(detail._id)
                    }}
                  >
                    Refund
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <RefundModal
        orderId={refundOrderId}
        open={Boolean(refundOrderId)}
        onOpenChange={(open) => !open && setRefundOrderId(null)}
        onSuccess={fetchList}
      />

      <BillReceiptModal
        open={Boolean(billOrder)}
        onClose={() => setBillOrder(null)}
        order={billOrder}
        restaurantName="TOrderPro"
      />
    </div>
  )
}
