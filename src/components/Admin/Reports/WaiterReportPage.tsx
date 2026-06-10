"use client"

import React from "react"
import { GET_ADMIN_REPORTS_WAITERS } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import type { WaiterReportData } from "@/types/reports"
import type { ReportDatePreset } from "@/utils/reports/dateRange"
import { formatPrice } from "@/utils/currency"
import {
  ReportDateFilter,
  ReportEmpty,
  ReportError,
  ReportInfoBanner,
  ReportLoading,
  ReportMetricCard,
  ReportPageHeader,
  useReportRangeGate,
} from "./ReportUi"

export default function WaiterReportPage() {
  const [preset, setPreset] = React.useState<ReportDatePreset>("last7")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [data, setData] = React.useState<WaiterReportData | null>(null)
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

    const res = await getApi<ApiResponse<WaiterReportData>>({
      url: GET_ADMIN_REPORTS_WAITERS,
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

  return (
    <div>
      <ReportPageHeader
        title="Зөөгчийн тайлан"
        subtitle="Ажилтны гүйцэтгэлийн тайлан"
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
          {!data.available && data.message ? (
            <ReportInfoBanner message={data.message} />
          ) : null}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportMetricCard
              title="Захиалгын тоо"
              value={String(data.metrics.totalOrders)}
            />
            <ReportMetricCard
              title="Орлого"
              value={formatPrice(data.metrics.totalRevenue)}
            />
            <ReportMetricCard
              title="Дундаж захиалга"
              value={formatPrice(data.metrics.averageOrderValue)}
            />
            <ReportMetricCard
              title="Идэвхтэй зөөгч"
              value={data.metrics.mostActiveWaiter ?? "—"}
            />
          </div>

          <ReportEmpty message="Зөөгчийн мэдээлэл одоогоор бүртгэгддэггүй. Захиалгад зөөгчийн ID нэмэгдсэний дараа энэ тайлан идэвхжинэ." />
        </>
      )}
    </div>
  )
}
